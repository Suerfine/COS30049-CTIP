import request from "supertest";
import app from "../../src/server";
import { Course, User } from "../../src/models";
import { UserRoles } from "../../src/enum/UserRoles";
import { CourseStatus } from "../../src/enum/CourseStatus";
import { hashPassword } from "../../src/utils/password";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";

const ADMIN_EMAIL = "admin.course@sfc.com.my";
const ADMIN_PASSWORD = "Admin123!";
const PARK_GUIDE_EMAIL = "parkguide.course@sfc.com.my";
const PARK_GUIDE_PASSWORD = "Guide123!";
const IMAGE_BUFFER = Buffer.from("fake-image-content");

async function createAdminUser(): Promise<User> {
  return User.create({
    username: "course-admin",
    firstname: "Course",
    lastname: "Admin",
    identification: "course-admin-id",
    personal_email: ADMIN_EMAIL,
    tel: "0123456789",
    role: UserRoles.ADMIN,
    password_hash: hashPassword(ADMIN_PASSWORD),
  });
}

async function createParkGuideUser(): Promise<User> {
  return User.create({
    username: "course-park-guide",
    firstname: "Course",
    lastname: "Guide",
    identification: "course-park-guide-id",
    personal_email: PARK_GUIDE_EMAIL,
    tel: "0198765432",
    role: UserRoles.PARK_GUIDE,
    password_hash: hashPassword(PARK_GUIDE_PASSWORD),
  });
}

async function createCourse(overrides: Partial<Course> = {}): Promise<Course> {
  return Course.create({
    title: "Seeded Course",
    description: "Seeded course description",
    status: CourseStatus.UNRELEASED,
    released_at: null,
    cost: 120,
    expected_completion_weeks: 4,
    must_complete_in_weeks: 8,
    badge_expire_in_months: 12,
    cover_img_path: "public/covers/seed.jpg",
    badge_img_path: "public/badges/seed.jpg",
    ...overrides,
  });
}

describe("Course Controller Integration Tests", () => {
  it("POST /api/courses - creates a course with uploaded cover and badge images", async () => {
    await createAdminUser();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("title", "Conservation Basics")
      .field("description", "Introduction to park conservation")
      .field("cost", "150")
      .attach("cover", IMAGE_BUFFER, {
        filename: "cover.png",
        contentType: "image/png",
      })
      .attach("badge", IMAGE_BUFFER, {
        filename: "badge.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Conservation Basics");
    expect(response.body.status).toBe(CourseStatus.UNRELEASED);

    const createdCourse = await Course.findOne({
      where: { title: "Conservation Basics" },
    });
    expect(createdCourse).not.toBeNull();
    expect(createdCourse?.cover_img_path).toContain("public");
    expect(createdCourse?.badge_img_path).toContain("public");
  });

  it("GET /api/courses - returns the created courses", async () => {
    await createAdminUser();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    await createCourse({ title: "Course A" });
    await createCourse({ title: "Course B" });

    const response = await request(app)
      .get("/api/courses")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.totalElements).toBe(2);
  });

  it("GET /api/courses/user - returns released courses available to the logged-in user", async () => {
    await createParkGuideUser();
    const accessToken = await login({
      username: PARK_GUIDE_EMAIL,
      password: PARK_GUIDE_PASSWORD,
    });
    await createCourse({
      title: "Released Course",
      status: CourseStatus.RELEASED,
      released_at: new Date(),
    });
    await createCourse({ title: "Hidden Course" });

    const response = await request(app)
      .get("/api/courses/user")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe("Released Course");
  });

  it("GET /api/courses/:id - returns one course", async () => {
    await createAdminUser();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    const course = await createCourse();

    const response = await request(app)
      .get(`/api/courses/${course.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(course.id);
    expect(response.body.title).toBe(course.title);
  });

  it("PUT /api/courses/:id - updates course details", async () => {
    await createAdminUser();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    const course = await createCourse();

    const response = await request(app)
      .put(`/api/courses/${course.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Updated Course",
        description: "Updated description",
        cost: 180,
        status: CourseStatus.RELEASED,
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated Course");
    expect(response.body.status).toBe(CourseStatus.RELEASED);

    const updatedCourse = await Course.findByPk(course.id);
    expect(updatedCourse?.title).toBe("Updated Course");
    expect(Number(updatedCourse?.cost)).toBe(180);
    expect(updatedCourse?.released_at).not.toBeNull();
  });

  it("DELETE /api/courses/:id - soft deletes a course", async () => {
    await createAdminUser();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    const course = await createCourse();

    const response = await request(app)
      .delete(`/api/courses/${course.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Course deleted successfully");

    const deletedCourse = await Course.findByPk(course.id);
    expect(deletedCourse).toBeNull();
  });
});
