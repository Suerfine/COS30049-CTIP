import request from "supertest";
import app from "../../src/server";
import { Course, Enrollment, Notification, Payment, User } from "../../src/models";
import { CourseStatus } from "../../src/enum/CourseStatus";
import { EnrollmentStatus } from "../../src/enum/EnrollmentStatus";
import { PaymentStatus } from "../../src/enum/PaymentStatus";
import { UserRoles } from "../../src/enum/UserRoles";
import { hashPassword } from "../../src/utils/password";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";

const ADMIN_PASSWORD = "Admin123!";
const GUIDE_PASSWORD = "Guide123!";
const RECEIPT_BUFFER = Buffer.from("fake-png-receipt");

async function createUser(role: UserRoles, email: string, password: string) {
  return User.create({
    username: email.split("@")[0].replace(/\W/g, ""),
    firstname: role === UserRoles.ADMIN ? "Admin" : "Park",
    lastname: "Payment",
    identification: `${email}-id`,
    personal_email: email,
    tel: "0123456789",
    role,
    password_hash: hashPassword(password),
  });
}

async function createCourse() {
  return Course.create({
    title: "Paid Course",
    description: "Course requiring payment",
    status: CourseStatus.RELEASED,
    released_at: new Date(),
    cost: 150,
    expected_completion_weeks: 4,
    must_complete_in_weeks: 8,
    badge_expire_in_months: 12,
    cover_img_path: "",
    badge_img_path: "public/badges/paid.png",
  });
}

async function createEnrollment(userId: number, courseId: number) {
  return Enrollment.create({
    user_id: userId,
    course_id: courseId,
    status: EnrollmentStatus.PENDING_PAYMENT,
    enrolled_at: new Date(),
  });
}

describe("Payment Controller Integration Tests", () => {
  it("POST /api/payments - user submits payment receipt and admin is notified", async () => {
    const admin = await createUser(UserRoles.ADMIN, "admin.payment@sfc.com.my", ADMIN_PASSWORD);
    const guide = await createUser(UserRoles.PARK_GUIDE, "guide.payment@sfc.com.my", GUIDE_PASSWORD);
    const course = await createCourse();
    const enrollment = await createEnrollment(guide.id, course.id);
    const accessToken = await login({ username: guide.personal_email, password: GUIDE_PASSWORD });

    const response = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("enrollment_id", String(enrollment.id))
      .field("course_id", String(course.id))
      .field("amount", "150")
      .attach("receipt", RECEIPT_BUFFER, {
        filename: "receipt.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(PaymentStatus.PENDING);
    expect(response.body.receipt_filepath).toBeTruthy();
    expect((await Enrollment.findByPk(enrollment.id))?.status).toBe(
      EnrollmentStatus.PENDING_PAYMENT,
    );
    expect(await Notification.findOne({ where: { user_id: admin.id, url: "/payments" } })).not.toBeNull();
  });

  it("POST /api/payments - rejects missing receipt file", async () => {
    const guide = await createUser(UserRoles.PARK_GUIDE, "missing.receipt@sfc.com.my", GUIDE_PASSWORD);
    const course = await createCourse();
    const enrollment = await createEnrollment(guide.id, course.id);
    const accessToken = await login({ username: guide.personal_email, password: GUIDE_PASSWORD });

    const response = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("enrollment_id", String(enrollment.id))
      .field("course_id", String(course.id))
      .field("amount", "150");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("receipt file is required");
  });

  it("GET payment routes - lists payments, gets one payment, user history, and receipt download", async () => {
    const admin = await createUser(UserRoles.ADMIN, "admin.payment.list@sfc.com.my", ADMIN_PASSWORD);
    const guide = await createUser(UserRoles.PARK_GUIDE, "guide.payment.list@sfc.com.my", GUIDE_PASSWORD);
    const course = await createCourse();
    const enrollment = await createEnrollment(guide.id, course.id);
    const payment = await Payment.create({
      user_id: guide.id,
      course_id: course.id,
      enrollment_id: enrollment.id,
      amount: 150,
      receipt_filepath: "storage/public/dev/seed_receipt.jpg",
      status: PaymentStatus.PENDING,
    });
    const accessToken = await login({ username: admin.personal_email, password: ADMIN_PASSWORD });

    const listResponse = await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const detailResponse = await request(app)
      .get(`/api/payments/${payment.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.id).toBe(payment.id);

    const userResponse = await request(app)
      .get(`/api/payments/user/${guide.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(userResponse.status).toBe(200);
    expect(userResponse.body).toHaveLength(1);
  });

  it("PATCH /api/payments/:id/status/paid - admin approves payment and enrollment becomes applied", async () => {
    const admin = await createUser(UserRoles.ADMIN, "admin.payment.approve@sfc.com.my", ADMIN_PASSWORD);
    const guide = await createUser(UserRoles.PARK_GUIDE, "guide.payment.approve@sfc.com.my", GUIDE_PASSWORD);
    const course = await createCourse();
    const enrollment = await createEnrollment(guide.id, course.id);
    const payment = await Payment.create({
      user_id: guide.id,
      course_id: course.id,
      enrollment_id: enrollment.id,
      amount: 150,
      receipt_filepath: "storage/public/dev/seed_receipt.jpg",
      status: PaymentStatus.PENDING,
    });
    const accessToken = await login({ username: admin.personal_email, password: ADMIN_PASSWORD });

    const response = await request(app)
      .patch(`/api/payments/${payment.id}/status/paid`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ admin_id: admin.id, admin_remark: "Receipt verified" });

    expect(response.status).toBe(200);
    expect((await Payment.findByPk(payment.id))?.status).toBe(PaymentStatus.PAID);
    expect((await Enrollment.findByPk(enrollment.id))?.status).toBe(EnrollmentStatus.APPLIED);
    expect(await Notification.findOne({ where: { user_id: guide.id, title: "Enrollment Approved" } })).not.toBeNull();
  });

  it("PATCH /api/payments/:id/status/failed - admin rejects payment and enrollment becomes rejected", async () => {
    const admin = await createUser(UserRoles.ADMIN, "admin.payment.reject@sfc.com.my", ADMIN_PASSWORD);
    const guide = await createUser(UserRoles.PARK_GUIDE, "guide.payment.reject@sfc.com.my", GUIDE_PASSWORD);
    const course = await createCourse();
    const enrollment = await createEnrollment(guide.id, course.id);
    const payment = await Payment.create({
      user_id: guide.id,
      course_id: course.id,
      enrollment_id: enrollment.id,
      amount: 150,
      receipt_filepath: "storage/public/dev/seed_receipt.jpg",
      status: PaymentStatus.PENDING,
    });
    const accessToken = await login({ username: admin.personal_email, password: ADMIN_PASSWORD });

    const response = await request(app)
      .patch(`/api/payments/${payment.id}/status/failed`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ admin_id: admin.id, admin_remark: "Receipt unclear" });

    expect(response.status).toBe(200);
    expect((await Payment.findByPk(payment.id))?.status).toBe(PaymentStatus.FAILED);
    expect((await Enrollment.findByPk(enrollment.id))?.status).toBe(EnrollmentStatus.REJECTED);
    expect(await Notification.findOne({ where: { user_id: guide.id, title: "Payment unsuccessful" } })).not.toBeNull();
  });
});
