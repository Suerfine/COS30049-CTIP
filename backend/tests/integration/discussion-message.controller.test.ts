import request from "supertest";
import app from "../../src/server";
import { Course, Discussion, Enrollment, Message, Notification, User } from "../../src/models";
import { CourseStatus } from "../../src/enum/CourseStatus";
import { EnrollmentStatus } from "../../src/enum/EnrollmentStatus";
import { UserRoles } from "../../src/enum/UserRoles";
import { hashPassword } from "../../src/utils/password";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";

const PASSWORD = "Password123!";

async function createUser(role: UserRoles, email: string, username: string) {
  return User.create({
    username,
    firstname: username,
    lastname: "Discussion",
    identification: `${username}-id`,
    personal_email: email,
    tel: "0123456789",
    role,
    password_hash: hashPassword(PASSWORD),
  });
}

async function createCourse() {
  return Course.create({
    title: "Discussion Course",
    description: "Course with discussion",
    status: CourseStatus.RELEASED,
    released_at: new Date(),
    cost: 0,
    expected_completion_weeks: 4,
    must_complete_in_weeks: 8,
    badge_expire_in_months: 12,
    cover_img_path: "",
    badge_img_path: "public/badges/discussion.png",
  });
}

async function enroll(userId: number, courseId: number) {
  return Enrollment.create({
    user_id: userId,
    course_id: courseId,
    status: EnrollmentStatus.IN_PROGRESS,
    enrolled_at: new Date(),
  });
}

describe("Discussion and Message Controller Integration Tests", () => {
  it("POST /api/courses/:course_id/discussion - creates public and private discussions", async () => {
    const guide = await createUser(UserRoles.PARK_GUIDE, "guide.discussion@sfc.com.my", "guidediscussion");
    const course = await createCourse();
    await enroll(guide.id, course.id);
    const accessToken = await login({ username: guide.personal_email, password: PASSWORD });

    const publicResponse = await request(app)
      .post(`/api/courses/${course.id}/discussion`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Public topic", is_public: true });

    expect(publicResponse.status).toBe(201);
    expect(publicResponse.body.is_public).toBe(true);

    const privateResponse = await request(app)
      .post(`/api/courses/${course.id}/discussion`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Private topic", is_public: false });

    expect(privateResponse.status).toBe(201);
    expect(privateResponse.body.is_public).toBe(false);
  });

  it("GET /api/courses/:course_id/discussion - admin sees all discussions and park guide sees allowed discussions", async () => {
    const admin = await createUser(UserRoles.ADMIN, "admin.discussion@sfc.com.my", "admindiscussion");
    const owner = await createUser(UserRoles.PARK_GUIDE, "owner.discussion@sfc.com.my", "ownerdiscussion");
    const viewer = await createUser(UserRoles.PARK_GUIDE, "viewer.discussion@sfc.com.my", "viewerdiscussion");
    const course = await createCourse();
    await enroll(owner.id, course.id);
    await enroll(viewer.id, course.id);
    await Discussion.create({ course_id: course.id, user_id: owner.id, title: "Public topic", is_public: true });
    await Discussion.create({ course_id: course.id, user_id: owner.id, title: "Private owner topic", is_public: false });

    const adminToken = await login({ username: admin.personal_email, password: PASSWORD });
    const viewerToken = await login({ username: viewer.personal_email, password: PASSWORD });

    const adminResponse = await request(app)
      .get(`/api/courses/${course.id}/discussion`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.data).toHaveLength(2);

    const viewerResponse = await request(app)
      .get(`/api/courses/${course.id}/discussion`)
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(viewerResponse.status).toBe(200);
    expect(viewerResponse.body.data.map((item: any) => item.title)).toEqual(["Public topic"]);
  });

  it("GET, PUT and DELETE discussion routes - retrieves, updates and deletes a discussion", async () => {
    const guide = await createUser(UserRoles.PARK_GUIDE, "manage.discussion@sfc.com.my", "managediscussion");
    const course = await createCourse();
    const discussion = await Discussion.create({
      course_id: course.id,
      user_id: guide.id,
      title: "Original topic",
      is_public: true,
    });
    const accessToken = await login({ username: guide.personal_email, password: PASSWORD });

    const getResponse = await request(app)
      .get(`/api/courses/${course.id}/discussion/${discussion.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.title).toBe("Original topic");

    const updateResponse = await request(app)
      .put(`/api/courses/${course.id}/discussion/${discussion.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated topic", is_public: false });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe("Updated topic");

    const deleteResponse = await request(app)
      .delete(`/api/courses/${course.id}/discussion/${discussion.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(deleteResponse.status).toBe(200);
    expect(await Discussion.findByPk(discussion.id)).toBeNull();
  });

  it("Message routes - user replies, mention creates notification, and owner deletes message", async () => {
    const author = await createUser(UserRoles.PARK_GUIDE, "author.message@sfc.com.my", "authormessage");
    const mentioned = await createUser(UserRoles.PARK_GUIDE, "mentioned.message@sfc.com.my", "mentioneduser");
    const course = await createCourse();
    const discussion = await Discussion.create({
      course_id: course.id,
      user_id: author.id,
      title: "Message topic",
      is_public: true,
    });
    const accessToken = await login({ username: author.personal_email, password: PASSWORD });

    const createResponse = await request(app)
      .post(`/api/discussion/${discussion.id}/messages`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Hello @mentioneduser, please check this." });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.content).toContain("@mentioneduser");
    expect(await Notification.findOne({ where: { user_id: mentioned.id } })).not.toBeNull();

    const listResponse = await request(app)
      .get(`/api/discussion/${discussion.id}/messages`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const messageId = createResponse.body.id;
    const detailResponse = await request(app)
      .get(`/api/messages/${messageId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(detailResponse.status).toBe(200);

    const updateResponse = await request(app)
      .put(`/api/messages/${messageId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Updated reply" });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.content).toBe("Updated reply");

    const deleteResponse = await request(app)
      .delete(`/api/messages/${messageId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(deleteResponse.status).toBe(200);
    expect(await Message.findByPk(messageId)).toBeNull();
  });
});
