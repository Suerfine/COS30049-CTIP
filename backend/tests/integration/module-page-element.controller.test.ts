import request from "supertest";
import app from "../../src/server";
import { Course, Element, Module as CourseModule, Page, User } from "../../src/models";
import { CourseStatus } from "../../src/enum/CourseStatus";
import { ElementTypes } from "../../src/enum/ElementTypes";
import { UserRoles } from "../../src/enum/UserRoles";
import { hashPassword } from "../../src/utils/password";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";

const ADMIN_EMAIL = "admin.content@sfc.com.my";
const ADMIN_PASSWORD = "Admin123!";

async function createAdminUser() {
  return User.create({
    username: "admincontent",
    firstname: "Admin",
    lastname: "Content",
    identification: "ADMIN-CONTENT-001",
    personal_email: ADMIN_EMAIL,
    tel: "0123456789",
    role: UserRoles.ADMIN,
    password_hash: hashPassword(ADMIN_PASSWORD),
  });
}

async function createCourse() {
  return Course.create({
    title: "Course Content Test",
    description: "Course used for module, page and element integration tests",
    status: CourseStatus.UNRELEASED,
    cost: 0,
    expected_completion_weeks: 4,
    must_complete_in_weeks: 8,
    badge_expire_in_months: 12,
    cover_img_path: "",
    badge_img_path: "public/badges/content.png",
  });
}

async function createContentTree() {
  const course = await createCourse();
  const module = await CourseModule.create({
    course_id: course.id,
    order: 1,
    title: "Safety Basics",
    description: "Module for page and element tests",
    complete_by_week: 1,
  });
  const page = await Page.create({
    module_id: module.id,
    order: 1,
    title: "Safety Quiz",
    description: "Quiz page",
    passing_score: 50,
    max_tries: 3,
    final_quiz: false,
  });

  return { course, module, page };
}

describe("Module, Page and Element Controller Integration Tests", () => {
  it("Module routes - admin creates, lists, retrieves, updates and deletes a course module", async () => {
    // Admin signs in because module management is part of the admin course builder flow
    await createAdminUser();
    const course = await createCourse();
    const accessToken = await login({ username: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    // Create a module under a specific course through the real HTTP endpoint
    const createResponse = await request(app)
      .post(`/api/courses/${course.id}/modules`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        order: 1,
        title: "Introduction",
        description: "Course introduction module",
        complete_by_week: 1,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.title).toBe("Introduction");

    // The created module should appear when the course module list is loaded
    const listResponse = await request(app)
      .get(`/api/courses/${course.id}/modules`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const moduleId = createResponse.body.id;
    const detailResponse = await request(app)
      .get(`/api/courses/${course.id}/modules/${moduleId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.id).toBe(moduleId);

    // Updating the module verifies the edit flow used by admin course management
    const updateResponse = await request(app)
      .put(`/api/courses/${course.id}/modules/${moduleId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Updated Introduction",
        order: 2,
        complete_by_week: 2,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe("Updated Introduction");
    expect(updateResponse.body.order).toBe(2);

    const deleteResponse = await request(app)
      .delete(`/api/courses/${course.id}/modules/${moduleId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(await CourseModule.findByPk(moduleId)).toBeNull();
  });

  it("Page routes - admin creates pages and updates quiz settings", async () => {
    // Build a course and module first because pages always belong inside a module
    await createAdminUser();
    const course = await createCourse();
    const module = await CourseModule.create({
      course_id: course.id,
      order: 1,
      title: "Knowledge Check Module",
      complete_by_week: 1,
    });
    const accessToken = await login({ username: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    // Create a quiz page with an initial passing score and maximum attempt limit
    const createResponse = await request(app)
      .post(`/api/courses/${course.id}/modules/${module.id}/pages`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        order: 1,
        title: "Plant Safety Quiz",
        description: "Quiz settings are created with the page",
        passing_score: 60,
        max_tries: 3,
        final_quiz: false,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.passing_score).toBe(60);
    expect(createResponse.body.max_tries).toBe(3);

    const pageId = createResponse.body.id;
    const listResponse = await request(app)
      .get(`/api/courses/${course.id}/modules/${module.id}/pages`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const detailResponse = await request(app)
      .get(`/api/courses/${course.id}/modules/${module.id}/pages/${pageId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.title).toBe("Plant Safety Quiz");

    // Update quiz-specific fields so the test covers the quiz settings admin edits
    const updateResponse = await request(app)
      .put(`/api/courses/${course.id}/modules/${module.id}/pages/${pageId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Final Plant Safety Quiz",
        passing_score: 80,
        max_tries: 2,
        final_quiz: true,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.passing_score).toBe(80);
    expect(updateResponse.body.max_tries).toBe(2);
    expect(updateResponse.body.final_quiz).toBe(true);

    const deleteResponse = await request(app)
      .delete(`/api/courses/${course.id}/modules/${module.id}/pages/${pageId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(await Page.findByPk(pageId)).toBeNull();
  });

  it("Element routes - admin creates, lists, retrieves, updates and deletes a quiz element", async () => {
    // Reuse a full course/module/page tree so the element is created in the correct location
    await createAdminUser();
    const { course, module, page } = await createContentTree();
    const accessToken = await login({ username: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    // Create the quiz objective element using multipart form fields, matching the actual route
    const createResponse = await request(app)
      .post(`/api/courses/${course.id}/modules/${module.id}/pages/${page.id}/elements`)
      .set("Authorization", `Bearer ${accessToken}`)
      .field("order", "1")
      .field("type", ElementTypes.QUIZ_OBJECTIVE)
      .field(
        "content",
        JSON.stringify({
          question: "Which action protects plants?",
          options: ["Stay on marked paths", "Pluck flowers"],
          answer: "Stay on marked paths",
        }),
      )
      .field("score", "10");

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.type).toBe(ElementTypes.QUIZ_OBJECTIVE);
    expect(createResponse.body.score).toBe(10);

    const elementId = createResponse.body.id;
    const listResponse = await request(app)
      .get(`/api/courses/${course.id}/modules/${module.id}/pages/${page.id}/elements`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const detailResponse = await request(app)
      .get(`/api/courses/${course.id}/modules/${module.id}/pages/${page.id}/elements/${elementId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.id).toBe(elementId);

    // Update the quiz score and content to cover admin editing of page quiz elements
    const updateResponse = await request(app)
      .put(`/api/courses/${course.id}/modules/${module.id}/pages/${page.id}/elements/${elementId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .field("order", "2")
      .field(
        "content",
        JSON.stringify({
          question: "Updated question",
          options: ["Correct", "Wrong"],
          answer: "Correct",
        }),
      )
      .field("score", "15");

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.order).toBe(2);
    expect(updateResponse.body.score).toBe(15);

    const deleteResponse = await request(app)
      .delete(`/api/courses/${course.id}/modules/${module.id}/pages/${page.id}/elements/${elementId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(await Element.findByPk(elementId)).toBeNull();
  });
});
