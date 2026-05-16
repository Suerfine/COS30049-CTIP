import request from "supertest";
import app from "../../src/server";
import { Notification, Registration, User } from "../../src/models";
import { UserRoles } from "../../src/enum/UserRoles";
import { RegistrationStatus } from "../../src/enum/RegistrationStatus";
import { hashPassword } from "../../src/utils/password";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";

const ADMIN_EMAIL = "admin.registration@sfc.com.my";
const ADMIN_PASSWORD = "Admin123!";
const PDF_BUFFER = Buffer.from("%PDF-1.4 test registration document");

async function createAdminUser(): Promise<User> {
  return User.create({
    username: "registration-admin",
    firstname: "Registration",
    lastname: "Admin",
    identification: "registration-admin-id",
    personal_email: ADMIN_EMAIL,
    tel: "0123456789",
    role: UserRoles.ADMIN,
    password_hash: hashPassword(ADMIN_PASSWORD),
  });
}

async function createPendingRegistration(overrides: Partial<Registration> = {}) {
  return Registration.create({
    user_id: null,
    reviewed_by_user_id: null,
    status: RegistrationStatus.PENDING,
    firstname: "Alya",
    lastname: "Rahman",
    identification: "REG-001",
    personal_email: "alya.rahman@example.com",
    tel: "0123456789",
    document_filepath: "private/registrations/test/document.pdf",
    admin_remark: null,
    reviewed_at: null,
    ...overrides,
  });
}

async function createRegistrationThroughApi(
  identification = "REG-UPLOAD-001",
  personalEmail = "uploaded.registration@example.com",
) {
  return request(app)
    .post("/api/registrations")
    .field("firstname", "Uploaded")
    .field("lastname", "Registration")
    .field("identification", identification)
    .field("personal_email", personalEmail)
    .field("tel", "0187654321")
    .attach("file", PDF_BUFFER, {
      filename: "registration.pdf",
      contentType: "application/pdf",
    });
}

describe("Registration Controller Integration Tests", () => {
  it("POST /api/registrations - creates a registration and notifies admins", async () => {
    const admin = await createAdminUser();

    const response = await request(app)
      .post("/api/registrations")
      .field("firstname", "John")
      .field("lastname", "Tester")
      .field("identification", "REG-NEW-001")
      .field("personal_email", "john.tester@example.com")
      .field("tel", "0198765432")
      .attach("file", PDF_BUFFER, {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(RegistrationStatus.PENDING);

    const createdRegistration = await Registration.findOne({
      where: { identification: "REG-NEW-001" },
    });
    expect(createdRegistration).not.toBeNull();
    expect(createdRegistration?.document_filepath).toContain("private");

    const adminNotification = await Notification.findOne({
      where: { user_id: admin.id, title: "New Park Guide Registration" },
    });
    expect(adminNotification).not.toBeNull();
    expect(adminNotification?.url).toBe("/registrations");
  });

  it("POST /api/registrations - rejects a duplicate pending registration", async () => {
    await createPendingRegistration();

    const response = await request(app)
      .post("/api/registrations")
      .field("firstname", "Alya")
      .field("lastname", "Rahman")
      .field("identification", "REG-001")
      .field("personal_email", "alya.rahman@example.com")
      .field("tel", "0123456789")
      .attach("file", PDF_BUFFER, {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("pending registration");
  });

  it("GET /api/registrations - returns registrations", async () => {
    await createAdminUser();
    await createPendingRegistration();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .get("/api/registrations")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.totalElements).toBe(1);
  });

  it("GET /api/registrations/:id - returns one registration", async () => {
    await createAdminUser();
    const registration = await createPendingRegistration();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .get(`/api/registrations/${registration.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(registration.id);
    expect(response.body.identification).toBe(registration.identification);
  });

  it("GET /api/registrations/:id/document - downloads the uploaded registration document", async () => {
    await createAdminUser();
    const createResponse = await createRegistrationThroughApi();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .get(`/api/registrations/${createResponse.body.id}/document`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toContain("attachment");
    expect(response.body).toEqual(PDF_BUFFER);
  });

  it("PUT /api/registrations/:id - updates registration details", async () => {
    await createAdminUser();
    const registration = await createPendingRegistration();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .put(`/api/registrations/${registration.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .field("firstname", "Updated")
      .field("tel", "0112233445");

    expect(response.status).toBe(200);
    expect(response.body.firstname).toBe("Updated");
    expect(response.body.tel).toBe("0112233445");
  });

  it("DELETE /api/registrations/:id - deletes a registration", async () => {
    await createAdminUser();
    const registration = await createPendingRegistration();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .delete(`/api/registrations/${registration.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Registration deleted successfully");
    expect(await Registration.findByPk(registration.id)).toBeNull();
  });

  it("POST /api/registrations/:id/approve - approves registration and creates a park guide account", async () => {
    await createAdminUser();
    const registration = await createPendingRegistration();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .post(`/api/registrations/${registration.id}/approve`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.registration.status).toBe(RegistrationStatus.APPROVED);
    expect(response.body.user.role).toBe(UserRoles.PARK_GUIDE);

    const updatedRegistration = await Registration.findByPk(registration.id);
    expect(updatedRegistration?.status).toBe(RegistrationStatus.APPROVED);
    expect(updatedRegistration?.user_id).not.toBeNull();

    const createdUser = await User.findByPk(updatedRegistration!.user_id!);
    expect(createdUser?.personal_email).toBe(registration.personal_email);
    expect(createdUser?.role).toBe(UserRoles.PARK_GUIDE);
  });

  it("POST /api/registrations/:id/reject - stores the admin rejection remark", async () => {
    const admin = await createAdminUser();
    const registration = await createPendingRegistration();
    const accessToken = await login({
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .post(`/api/registrations/${registration.id}/reject`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ message: "Document is incomplete" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(RegistrationStatus.REJECTED);
    expect(response.body.admin_remark).toBe("Document is incomplete");
    expect(response.body.reviewed_by_user_id).toBe(admin.id);
  });
});
