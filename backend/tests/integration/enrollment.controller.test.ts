import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import app from "../../src/server";
import {
  Course,
  Element,
  Enrollment,
  Module,
  Page,
  Payment,
  Submission,
  User,
} from "../../src/models";
import { UserRoles } from "../../src/enum/UserRoles";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";
import { buildUser } from "../../database/factories/UserFactory";
import { buildCourse } from "../../database/factories/CourseFactory";
import { EnrollmentStatus } from "../../src/enum/EnrollmentStatus";
import { Op } from "sequelize";
import { ElementTypes } from "../../src/enum/ElementTypes";
import { getMailer } from "../../src/services/mailer";

const PASSWORD = "password";
const ADMIN_PASSWORD = "admin-password";
const IMAGE_BUFFER = Buffer.from("fake-image-content");

const mailer = getMailer();

function generateSfcEmail(user: User): string {
  return mailer.generateSfcEmail(user.id);
}

async function createParkGuideUser(): Promise<User> {
  return User.create(
    buildUser({
      password: PASSWORD,
      role: UserRoles.PARK_GUIDE,
      personal_email: "parkguide.enrollment@sfc.com.my",
      username: "parkguide-enrollment",
      identification: "parkguide-enrollment-id",
      firstname: "Park",
      lastname: "Guide",
      tel: "0123456789",
    }),
  );
}

async function createAdminUser(): Promise<User> {
  return User.create(
    buildUser({
      password: ADMIN_PASSWORD,
      role: UserRoles.ADMIN,
      personal_email: "admin.enrollment@sfc.com.my",
      username: "admin-enrollment",
      identification: "admin-enrollment-id",
      firstname: "Admin",
      lastname: "User",
      tel: "0198765432",
    }),
  );
}

async function createCourse(): Promise<Course> {
  return Course.create(buildCourse());
}

async function createEnrollmentFixture(options: {
  user: User;
  course: Course;
  status?: EnrollmentStatus;
  reviewedBy?: User | null;
  completedAt?: Date | null;
  badgeExpireAt?: Date | null;
}): Promise<Enrollment> {
  const enrollment = await Enrollment.create({
    user_id: options.user.id!,
    course_id: options.course.id!,
    status: options.status ?? EnrollmentStatus.IN_PROGRESS,
    enrolled_at: new Date(Date.now() - 1000 * 60 * 60 * 24),
    reviewed_by_user_id: options.reviewedBy?.id ?? null,
    reviewed_at: options.reviewedBy ? new Date() : null,
    reviewed_comment: null,
    completed_at: options.completedAt ?? null,
    badge_expire_at: options.badgeExpireAt ?? null,
  });

  return enrollment;
}

async function createAuditFixture(): Promise<{
  enrollment: Enrollment;
  course: Course;
  module: Module;
  page: Page;
  element: Element;
  submission: Submission;
}> {
  const user = await createParkGuideUser();
  const course = await createCourse();
  const enrollment = await createEnrollmentFixture({
    user,
    course,
    status: EnrollmentStatus.IN_PROGRESS,
  });

  const module = await Module.create({
    course_id: course.id!,
    order: 1,
    title: "Audit Module",
    description: "Audit module description",
    complete_by_week: 1,
  });

  const page = await Page.create({
    module_id: module.id!,
    order: 1,
    title: "Audit Page",
    description: "Audit page description",
    passing_score: 1,
    max_tries: 3,
    final_quiz: true,
  });

  const element = await Element.create({
    page_id: page.id!,
    order: 1,
    type: ElementTypes.TEXT,
    content: {
      text: "Audit element content",
    },
    score: 1,
  });

  const submission = await Submission.create({
    enrollment_id: enrollment.id!,
    element_id: element.id!,
    content: {
      answer: "sample answer",
    },
    earned_grade: 95,
  });

  return { enrollment, course, module, page, element, submission };
}

describe("Enrollment Controller Integration Tests", () => {
  it("POST /api/enrollments/:course_id/enroll - should allow user to enroll in a course", async () => {
    // Create a test user and a course
    const user = await User.create(
      buildUser({
        password: "password",
        role: UserRoles.PARK_GUIDE,
      }),
    );
    const course = await Course.create(buildCourse());

    // Log in as the user to get an auth token
    const token = await login({
      username: generateSfcEmail(user),
      password: "password",
    });

    // Attempt to enroll in the course (upload a receipt image)
    const response: SupertestResponse = await request(app)
      .post(`/api/enrollments/${course.id}/enroll`)
      .set("Authorization", `Bearer ${token}`)
      .attach("receipt", Buffer.from("testImage", "base64"), {
        filename: "receipt.png",
        contentType: "image/png",
      });

    // Expect a successful enrollment
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.status).toBe(EnrollmentStatus.PENDING_PAYMENT);

    // Check a payment record was created
    const payment = await Payment.findOne({
      where: { enrollment_id: response.body.id },
    });
    expect(payment).not.toBeNull();
    expect(payment?.amount).toBe(course.cost);
  });

  it("POST /api/enrollments/:course_id/enroll - should allow user to reenroll in a course after their badge expired", async () => {
    // Create a test user, a course and an enrollment that is failed/expired
    const user = await User.create(
      buildUser({
        password: "password",
        role: UserRoles.PARK_GUIDE,
      }),
    );
    const course = await Course.create(buildCourse());
    const enrollment = await Enrollment.create({
      user_id: user.id!,
      course_id: course.id!,
      status: EnrollmentStatus.EXPIRED,
      enrolled_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // Enrolled 30 days ago
      badge_expire_at: new Date(Date.now() - 1000 * 60 * 60 * 24), // Set badge expired in the past (-1 day)
    });

    // Log in as the user to get an auth token
    const token = await login({
      username: generateSfcEmail(user),
      password: "password",
    });

    // Attempt to enroll in the same course again (upload a receipt image)
    const response: SupertestResponse = await request(app)
      .post(`/api/enrollments/${course.id}/enroll`)
      .set("Authorization", `Bearer ${token}`)
      .attach("receipt", Buffer.from("testImage", "base64"), {
        filename: "receipt.png",
        contentType: "image/png",
      });

    // Expect a successful enrollment
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.status).toBe(EnrollmentStatus.PENDING_PAYMENT);

    // Verify that the enrollment record was updated in the database
    const newEnrollment = await Enrollment.findOne({
      where: {
        user_id: user.id,
        course_id: course.id,
        id: { [Op.ne]: enrollment.id },
      },
    });
    expect(newEnrollment).not.toBeNull();
    expect(
      [
        EnrollmentStatus.FAILED,
        EnrollmentStatus.DROPPED,
        EnrollmentStatus.REJECTED,
        EnrollmentStatus.EXPIRED,
      ].includes(newEnrollment!.status),
    ).toBe(false);
  });

  it("POST /api/enrollments/:course_id/enroll - should allow user to reenroll in a course after they have failed, dropped, or rejected", async () => {
    // Create a test user, a course and an enrollment that is failed
    const user = await User.create(
      buildUser({
        password: "password",
        role: UserRoles.PARK_GUIDE,
      }),
    );
    const course = await Course.create(buildCourse());
    const enrollment = await Enrollment.create({
      user_id: user.id!,
      course_id: course.id!,
      status: EnrollmentStatus.FAILED,
      enrolled_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // Enrolled 30 days ago
    });

    // Log in as the user to get an auth token
    const token = await login({
      username: generateSfcEmail(user),
      password: "password",
    });

    // Attempt to enroll in the same course again (upload a receipt image)
    const response: SupertestResponse = await request(app)
      .post(`/api/enrollments/${course.id}/enroll`)
      .set("Authorization", `Bearer ${token}`)
      .attach("receipt", Buffer.from("testImage", "base64"), {
        filename: "receipt.png",
        contentType: "image/png",
      });

    // Expect a successful enrollment
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.status).toBe(EnrollmentStatus.PENDING_PAYMENT);
    // Verify that the enrollment record was updated in the database
    const newEnrollment = await Enrollment.findOne({
      where: {
        user_id: user.id,
        course_id: course.id,
        id: { [Op.ne]: enrollment.id },
      },
    });
    expect(newEnrollment).not.toBeNull();
    expect(
      [
        EnrollmentStatus.FAILED,
        EnrollmentStatus.DROPPED,
        EnrollmentStatus.REJECTED,
        EnrollmentStatus.EXPIRED,
      ].includes(newEnrollment!.status),
    ).toBe(false);

    // Update the latest enrollment as dropped and then try enrolling again to ensure user can reenroll after dropped
    await newEnrollment?.update({ status: EnrollmentStatus.DROPPED });
    const response2: SupertestResponse = await request(app)
      .post(`/api/enrollments/${course.id}/enroll`)
      .set("Authorization", `Bearer ${token}`)
      .attach("receipt", Buffer.from("testImage", "base64"), {
        filename: "receipt.png",
        contentType: "image/png",
      });
    expect(response2.status).toBe(201);
    expect(response2.body).toHaveProperty("id");
    expect(response2.body.status).toBe(EnrollmentStatus.PENDING_PAYMENT);
    // Verify that there is a new enrollment record created in the database
    const newEnrollment2 = await Enrollment.findOne({
      where: {
        user_id: user.id,
        course_id: course.id,
        id: { [Op.notIn]: [enrollment.id, newEnrollment!.id] },
      },
    });
    expect(newEnrollment2).not.toBeNull();
    expect(
      [
        EnrollmentStatus.FAILED,
        EnrollmentStatus.DROPPED,
        EnrollmentStatus.REJECTED,
        EnrollmentStatus.EXPIRED,
      ].includes(newEnrollment2!.status),
    ).toBe(false);
  });

  it("GET /api/enrollments - returns active enrollments and can include deleted enrollments", async () => {
    const admin = await createAdminUser();
    const token = await login({
      username: generateSfcEmail(admin),
      password: ADMIN_PASSWORD,
    });

    const activeUser = await createParkGuideUser();
    const activeCourse = await createCourse();
    const activeEnrollment = await createEnrollmentFixture({
      user: activeUser,
      course: activeCourse,
      status: EnrollmentStatus.IN_PROGRESS,
    });

    const deletedUser = await User.create(
      buildUser({
        password: PASSWORD,
        role: UserRoles.PARK_GUIDE,
        personal_email: "deleted.enrollment@sfc.com.my",
        username: "deleted-enrollment",
        identification: "deleted-enrollment-id",
        firstname: "Deleted",
        lastname: "User",
        tel: "0111111111",
      }),
    );
    const deletedCourse = await createCourse();
    const deletedEnrollment = await createEnrollmentFixture({
      user: deletedUser,
      course: deletedCourse,
      status: EnrollmentStatus.IN_PROGRESS,
    });
    await deletedEnrollment.destroy();

    const activeResponse = await request(app)
      .get("/api/enrollments")
      .set("Authorization", `Bearer ${token}`)
      .query({ page: 1, size: 10 });

    expect(activeResponse.status).toBe(200);
    expect(activeResponse.body.totalElements).toBe(1);
    expect(activeResponse.body.data[0].id).toBe(activeEnrollment.id);

    const deletedResponse = await request(app)
      .get("/api/enrollments")
      .set("Authorization", `Bearer ${token}`)
      .query({ page: 1, size: 10, isDeleted: true });

    expect(deletedResponse.status).toBe(200);
    expect(deletedResponse.body.totalElements).toBe(2);
  });

  it("GET /api/enrollments/my-enrollments - filters to the current user and status", async () => {
    const user = await createParkGuideUser();
    const token = await login({
      username: generateSfcEmail(user),
      password: PASSWORD,
    });

    const courseOne = await createCourse();
    const courseTwo = await createCourse();
    const inProgressEnrollment = await createEnrollmentFixture({
      user,
      course: courseOne,
      status: EnrollmentStatus.IN_PROGRESS,
    });
    const admin = await createAdminUser();
    await createEnrollmentFixture({
      user,
      course: courseTwo,
      status: EnrollmentStatus.COMPLETED,
      reviewedBy: admin,
      completedAt: new Date(),
      badgeExpireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    const otherUser = await User.create(
      buildUser({
        password: PASSWORD,
        role: UserRoles.PARK_GUIDE,
        personal_email: "other.enrollment@sfc.com.my",
        username: "other-enrollment",
        identification: "other-enrollment-id",
        firstname: "Other",
        lastname: "User",
        tel: "0188888888",
      }),
    );
    const otherCourse = await createCourse();
    await createEnrollmentFixture({
      user: otherUser,
      course: otherCourse,
      status: EnrollmentStatus.IN_PROGRESS,
    });

    const response = await request(app)
      .get("/api/enrollments/my-enrollments")
      .set("Authorization", `Bearer ${token}`)
      .query({ page: 1, size: 10, status: EnrollmentStatus.IN_PROGRESS });

    expect(response.status).toBe(200);
    expect(response.body.totalElements).toBe(1);
    expect(response.body.data[0].id).toBe(inProgressEnrollment.id);
    expect(response.body.data[0].status).toBe(EnrollmentStatus.IN_PROGRESS);
  });

  it("PATCH /api/enrollments/:id/status/:status - updates an enrollment status", async () => {
    const admin = await createAdminUser();
    const token = await login({
      username: generateSfcEmail(admin),
      password: ADMIN_PASSWORD,
    });

    const user = await createParkGuideUser();
    const course = await createCourse();
    const enrollment = await createEnrollmentFixture({
      user,
      course,
      status: EnrollmentStatus.PENDING_PAYMENT,
    });

    const response = await request(app)
      .patch(
        `/api/enrollments/${enrollment.id}/status/${EnrollmentStatus.APPLIED}`,
      )
      .set("Authorization", `Bearer ${token}`)
      .send({ reviewed_comment: "Payment confirmed" });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(enrollment.id);
    expect(response.body.status).toBe(EnrollmentStatus.APPLIED);

    const updatedEnrollment = await Enrollment.findByPk(enrollment.id);
    expect(updatedEnrollment?.status).toBe(EnrollmentStatus.APPLIED);
  });

  it("DELETE /api/enrollments/:id - soft deletes an enrollment", async () => {
    const admin = await createAdminUser();
    const token = await login({
      username: generateSfcEmail(admin),
      password: ADMIN_PASSWORD,
    });

    const user = await createParkGuideUser();
    const course = await createCourse();
    const enrollment = await createEnrollmentFixture({
      user,
      course,
      status: EnrollmentStatus.IN_PROGRESS,
    });

    const response = await request(app)
      .delete(`/api/enrollments/${enrollment.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Enrollment deleted successfully");

    const deletedEnrollment = await Enrollment.findByPk(enrollment.id);
    expect(deletedEnrollment).toBeNull();

    const softDeletedEnrollment = await Enrollment.findByPk(enrollment.id, {
      paranoid: false,
    });
    expect(softDeletedEnrollment?.deleted_at).not.toBeNull();
  });

  it("GET /api/enrollments/submissions/summaries - returns hydrated submission summaries", async () => {
    const admin = await createAdminUser();
    const token = await login({
      username: generateSfcEmail(admin),
      password: ADMIN_PASSWORD,
    });

    const user = await createParkGuideUser();
    const course = await createCourse();
    const completedAt = new Date("2026-05-07T10:00:00.000Z");
    const badgeExpireMonths = course.badge_expire_in_months;
    const enrollment = await createEnrollmentFixture({
      user,
      course,
      status: EnrollmentStatus.COMPLETED,
      reviewedBy: admin,
      completedAt,
      badgeExpireAt: new Date(
        completedAt.getTime() + badgeExpireMonths * 30 * 24 * 60 * 60 * 1000,
      ),
    });

    const pendingUser = await User.create(
      buildUser({
        password: PASSWORD,
        role: UserRoles.PARK_GUIDE,
        personal_email: "pending.enrollment@sfc.com.my",
        username: "pending-enrollment",
        identification: "pending-enrollment-id",
        firstname: "Pending",
        lastname: "User",
        tel: "0177777777",
      }),
    );
    const pendingCourse = await createCourse();
    await createEnrollmentFixture({
      user: pendingUser,
      course: pendingCourse,
      status: EnrollmentStatus.PENDING_PAYMENT,
    });

    const response = await request(app)
      .get("/api/enrollments/submissions/summaries")
      .set("Authorization", `Bearer ${token}`)
      .query({ page: 1, size: 10 });

    expect(response.status).toBe(200);
    expect(response.body.totalElements).toBe(1);
    expect(response.body.data[0].id).toBe(enrollment.id);
    expect(response.body.data[0].user_fullname).toBe(
      `${user.firstname} ${user.lastname}`,
    );
    expect(response.body.data[0].course_details.id).toBe(course.id);
    expect(response.body.data[0].badge_expire_at).toMatch(/T/);
  });

  it("GET /api/enrollments/:id/audit - returns nested course, module, page, element, and submission data", async () => {
    const admin = await createAdminUser();
    const token = await login({
      username: generateSfcEmail(admin),
      password: ADMIN_PASSWORD,
    });

    const { enrollment, course, module, page, element, submission } =
      await createAuditFixture();

    const response = await request(app)
      .get(`/api/enrollments/${enrollment.id}/audit`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(enrollment.id);
    expect(response.body.course.id).toBe(course.id);
    expect(response.body.course.modules[0].id).toBe(module.id);
    expect(response.body.course.modules[0].pages[0].id).toBe(page.id);
    expect(response.body.course.modules[0].pages[0].elements[0].id).toBe(
      element.id,
    );
    expect(
      response.body.course.modules[0].pages[0].elements[0].submissions[0].id,
    ).toBe(submission.id);
    expect(
      response.body.course.modules[0].pages[0].elements[0].submissions[0]
        .earned_grade,
    ).toBe(95);
  });

  it("PATCH /api/enrollments/:id/approve - completes an in-review enrollment and issues a badge", async () => {
    const admin = await createAdminUser();
    const token = await login({
      username: generateSfcEmail(admin),
      password: ADMIN_PASSWORD,
    });

    const user = await createParkGuideUser();
    const course = await createCourse();
    const enrollment = await createEnrollmentFixture({
      user,
      course,
      status: EnrollmentStatus.IN_REVIEW,
    });

    const response = await request(app)
      .patch(`/api/enrollments/${enrollment.id}/approve`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(enrollment.id);
    expect(response.body.status).toBe(EnrollmentStatus.COMPLETED);
    expect(response.body.badge_expire_at).not.toBeNull();

    const approvedEnrollment = await Enrollment.findByPk(enrollment.id);
    expect(approvedEnrollment?.status).toBe(EnrollmentStatus.COMPLETED);
    expect(approvedEnrollment?.badge_expire_at).not.toBeNull();
  });
});
