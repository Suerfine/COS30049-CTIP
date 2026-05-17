import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import app from "../../src/server";
import { Course, Enrollment, Payment, User } from "../../src/models";
import { UserRoles } from "../../src/enum/UserRoles";
import { hashPassword } from "../../src/utils/password";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";
import { faker, Faker } from "@faker-js/faker";
import { beforeEach } from "node:test";
import { buildUser } from "../../database/factories/userFactory";
import { buildCourse } from "../../database/factories/courseFactory";
import { EnrollmentStatus } from "../../src/enum/EnrollmentStatus";
import { Op } from "sequelize";

faker.seed(); // Seed faker for consistent test data

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
      username: user.personal_email,
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
      username: user.personal_email,
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
      username: user.personal_email,
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
    newEnrollment?.update({ status: EnrollmentStatus.DROPPED });
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
});
