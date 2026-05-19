import request from "supertest";
import app from "../../src/server";
import {
  Course,
  Element,
  Enrollment,
  Module as CourseModule,
  Page,
  Submission,
  User,
} from "../../src/models";
import { CourseStatus } from "../../src/enum/CourseStatus";
import { ElementTypes } from "../../src/enum/ElementTypes";
import { EnrollmentStatus } from "../../src/enum/EnrollmentStatus";
import { UserRoles } from "../../src/enum/UserRoles";
import { hashPassword } from "../../src/utils/password";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";

const ADMIN_EMAIL = "admin.submission@sfc.com.my";
const ADMIN_PASSWORD = "Admin123!";
const GUIDE_EMAIL = "guide.submission@sfc.com.my";
const GUIDE_PASSWORD = "Guide123!";

async function createUser(role: UserRoles, email: string, password: string) {
  return User.create({
    username: email.split("@")[0].replace(/\W/g, ""),
    firstname: role === UserRoles.ADMIN ? "Admin" : "Park",
    lastname: "Submission",
    identification: `${email}-id`,
    personal_email: email,
    tel: "0123456789",
    role,
    password_hash: hashPassword(password),
  });
}

async function createCourseContent(maxTries = 2) {
  const course = await Course.create({
    title: "Submission Course",
    description: "Course used for submission integration tests",
    status: CourseStatus.RELEASED,
    released_at: new Date(),
    cost: 0,
    expected_completion_weeks: 4,
    must_complete_in_weeks: 8,
    badge_expire_in_months: 12,
    cover_img_path: "",
    badge_img_path: "public/badges/submission.png",
  });
  const module = await CourseModule.create({
    course_id: course.id,
    order: 1,
    title: "Quiz Module",
    complete_by_week: 1,
  });
  const page = await Page.create({
    module_id: module.id,
    order: 1,
    title: "Quiz Page",
    passing_score: 50,
    max_tries: maxTries,
    final_quiz: true,
  });
  const element = await Element.create({
    page_id: page.id,
    order: 1,
    type: ElementTypes.QUIZ_OBJECTIVE,
    content: {
      question: "What should a park guide do?",
      options: ["Protect the park", "Ignore safety"],
      answer: "Protect the park",
    },
    score: 10,
  });

  return { course, module, page, element };
}

async function createEnrollment(userId: number, courseId: number) {
  return Enrollment.create({
    user_id: userId,
    course_id: courseId,
    status: EnrollmentStatus.IN_PROGRESS,
    enrolled_at: new Date(),
  });
}

describe("Submission Controller Integration Tests", () => {
  it("POST /api/submission - user submits progress and quiz score is saved", async () => {
    // Park guide must own an active enrollment before submitting quiz or workshop progress
    const guide = await createUser(UserRoles.PARK_GUIDE, GUIDE_EMAIL, GUIDE_PASSWORD);
    const { course, element } = await createCourseContent();
    const enrollment = await createEnrollment(guide.id, course.id);
    const accessToken = await login({ username: GUIDE_EMAIL, password: GUIDE_PASSWORD });

    // Create a submission with an explicit grade to verify the score is persisted
    const response = await request(app)
      .post("/api/submission")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        enrollment_id: enrollment.id,
        element_id: element.id,
        content: { selected: "Protect the park" },
        earned_grade: 10,
      });

    expect(response.status).toBe(201);
    expect(response.body.enrollment_id).toBe(enrollment.id);
    expect(response.body.element_id).toBe(element.id);
    expect(response.body.earned_grade).toBe(10);

    const savedSubmission = await Submission.findByPk(response.body.id);
    expect(savedSubmission?.earned_grade).toBe(10);
  });

  it("Submission routes - retrieves, updates, lists by enrollment and deletes a submission", async () => {
    // This covers the normal submission management endpoints used after progress is saved
    const guide = await createUser(UserRoles.PARK_GUIDE, "guide.submission.manage@sfc.com.my", GUIDE_PASSWORD);
    const { course, element } = await createCourseContent();
    const enrollment = await createEnrollment(guide.id, course.id);
    const submission = await Submission.create({
      enrollment_id: enrollment.id,
      element_id: element.id,
      content: { selected: "Initial answer" },
      earned_grade: 5,
    });
    const accessToken = await login({
      username: guide.personal_email,
      password: GUIDE_PASSWORD,
    });

    const detailResponse = await request(app)
      .get(`/api/submission/${submission.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.id).toBe(submission.id);

    const updateResponse = await request(app)
      .put(`/api/submission/${submission.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: { selected: "Updated answer" },
        earned_grade: 8,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.earned_grade).toBe(8);

    const elementHistoryResponse = await request(app)
      .get(`/api/enrollment/${enrollment.id}/element/${element.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(elementHistoryResponse.status).toBe(200);
    expect(elementHistoryResponse.body).toHaveLength(1);

    const enrollmentHistoryResponse = await request(app)
      .get(`/api/submission/enrollment/${enrollment.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(enrollmentHistoryResponse.status).toBe(200);
    expect(enrollmentHistoryResponse.body).toHaveLength(1);

    const deleteResponse = await request(app)
      .delete(`/api/submission/${submission.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(await Submission.findByPk(submission.id)).toBeNull();
  });

  it("POST /api/submission/:id/mark - admin marks a submission", async () => {
    // Admin marking is tested separately from user submission because it has role-based behaviour
    const admin = await createUser(UserRoles.ADMIN, ADMIN_EMAIL, ADMIN_PASSWORD);
    const guide = await createUser(UserRoles.PARK_GUIDE, "guide.marked@sfc.com.my", GUIDE_PASSWORD);
    const { course, element } = await createCourseContent();
    const enrollment = await createEnrollment(guide.id, course.id);
    const submission = await Submission.create({
      enrollment_id: enrollment.id,
      element_id: element.id,
      content: { uploaded: "workshop reflection" },
      earned_grade: 0,
    });
    const accessToken = await login({ username: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    const response = await request(app)
      .post(`/api/submission/${submission.id}/mark`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        earned_grade: 85,
        marking_remark: "Good explanation",
      });

    expect(response.status).toBe(200);
    expect(response.body.earned_grade).toBe(85);
    expect(response.body.marked_by_user_id).toBe(admin.id);
    expect(response.body.marking_remark).toBe("Good explanation");
  });

  it("POST /api/submission/:id/submit - blocks attempts after max tries", async () => {
    // The page max_tries setting should stop users from submitting too many attempts
    const guide = await createUser(UserRoles.PARK_GUIDE, "guide.maxtries@sfc.com.my", GUIDE_PASSWORD);
    const { course, element } = await createCourseContent(2);
    const enrollment = await createEnrollment(guide.id, course.id);
    const rootSubmission = await Submission.create({
      enrollment_id: enrollment.id,
      element_id: element.id,
      content: { selected: "First answer" },
      earned_grade: 0,
    });
    const accessToken = await login({
      username: guide.personal_email,
      password: GUIDE_PASSWORD,
    });

    const firstAttemptResponse = await request(app)
      .post(`/api/submission/${rootSubmission.id}/submit`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ selected: "Second answer" });

    expect(firstAttemptResponse.status).toBe(201);
    expect(firstAttemptResponse.body.submission_id).toBe(rootSubmission.id);

    const blockedAttemptResponse = await request(app)
      .post(`/api/submission/${rootSubmission.id}/submit`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ selected: "Third answer" });

    expect(blockedAttemptResponse.status).toBe(400);
    expect(blockedAttemptResponse.body.message).toBe(
      "Maximum number of attempts reached for this question",
    );
  });
});
