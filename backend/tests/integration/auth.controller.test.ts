import crypto from "crypto";
import { describe, expect, it, beforeAll } from "@jest/globals";
import {
  forgotPassword,
  resetPassword,
  token,
} from "../../src/controllers/AuthController";
import { PasswordResetToken, User } from "../../src/models";
import { hashPassword } from "../../src/utils/password";
import { UserRoles } from "../../src/enum/UserRoles";

beforeAll(() => {
  process.env.FRONTEND_URL = "http://localhost:8081";
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  delete process.env.SMTP_FROM;
});

function createMockRequest(body: Record<string, unknown> = {}) {
  return { body } as any;
}

function createMockResponse() {
  const response = {
    statusCode: null as number | null,
    jsonData: null as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.jsonData = data;
      return this;
    },
  };
  return response;
}

async function createTestUser(email: string) {
  const localPart = email.split("@")[0];
  return User.create({
    username: localPart,
    firstname: "Test",
    lastname: "User",
    identification: localPart,
    personal_email: email,
    tel: "0123456789",
    role: UserRoles.PARK_GUIDE,
    password_hash: hashPassword("OldPassword123!"),
  });
}

describe("Auth Controller Integration Tests", () => {
  it("creates a password reset token record for an existing user", async () => {
    const user = await createTestUser("testuser@example.com");
    const req = createMockRequest({ email: user.personal_email });
    const res = createMockResponse();

    await forgotPassword(req, res as any, () => undefined);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.message).toMatch(/If the email exists/);

    const tokenRecords = await PasswordResetToken.findAll({
      where: { user_id: user.id },
    });
    expect(tokenRecords).toHaveLength(1);
    expect(tokenRecords[0].token_hash).toBeTruthy();
    expect(tokenRecords[0].expires_at).toBeTruthy();
    expect(tokenRecords[0].used_at).toBeNull();
  });

  it("resets password with a valid token and allows login with the new password", async () => {
    const user = await createTestUser("user2@example.com");

    const forgotReq = createMockRequest({ email: user.personal_email });
    const forgotRes = createMockResponse();
    await forgotPassword(forgotReq, forgotRes as any, () => undefined);

    const tokenRecord = await PasswordResetToken.findOne({
      where: { user_id: user.id },
    });
    expect(tokenRecord).not.toBeNull();

    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");

    await PasswordResetToken.update(
      { token_hash: tokenHash },
      { where: { id: tokenRecord!.id } },
    );

    const newPassword = "NewPassword123!";
    const resetReq = createMockRequest({
      token: plainToken,
      password: newPassword,
    });
    const resetRes = createMockResponse();

    await resetPassword(resetReq, resetRes as any, () => undefined);

    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.jsonData.message).toMatch(/Password reset successfully/);

    const updatedToken = await PasswordResetToken.findByPk(tokenRecord!.id);
    expect(updatedToken?.used_at).toBeTruthy();

    const loginReq = createMockRequest({
      username: `${user.id}@sfc.gov.my`,
      password: newPassword,
    });
    const loginRes = createMockResponse();

    await token(loginReq, loginRes as any, () => undefined);

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.jsonData.access_token).toBeTruthy();
  });

  it("rejects reused token", async () => {
    const user = await createTestUser("user3@example.com");
    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");

    await PasswordResetToken.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 30 * 60 * 1000),
    });

    const req1 = createMockRequest({
      token: plainToken,
      password: "FirstReset123!",
    });
    const res1 = createMockResponse();
    await resetPassword(req1, res1 as any, () => undefined);
    expect(res1.statusCode).toBe(200);

    const req2 = createMockRequest({
      token: plainToken,
      password: "SecondReset123!",
    });
    const res2 = createMockResponse();
    await resetPassword(req2, res2 as any, () => undefined);

    expect(res2.statusCode).toBe(400);
    expect(res2.jsonData.message).toMatch(/already been used/);
  });

  it("rejects expired and invalid reset tokens", async () => {
    const user = await createTestUser("user4@example.com");
    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");

    await PasswordResetToken.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() - 1000),
    });

    const expiredReq = createMockRequest({
      token: plainToken,
      password: "NewPassword123!",
    });
    const expiredRes = createMockResponse();
    await resetPassword(expiredReq, expiredRes as any, () => undefined);

    expect(expiredRes.statusCode).toBe(400);
    expect(expiredRes.jsonData.message).toMatch(/Invalid or expired/);

    const invalidReq = createMockRequest({
      token: "invalid-token-that-does-not-exist",
      password: "NewPassword123!",
    });
    const invalidRes = createMockResponse();
    await resetPassword(invalidReq, invalidRes as any, () => undefined);

    expect(invalidRes.statusCode).toBe(400);
    expect(invalidRes.jsonData.message).toMatch(/Invalid or expired/);
  });

  it("handles missing inputs and unknown email safely", async () => {
    const unknownReq = createMockRequest({ email: "missing@example.com" });
    const unknownRes = createMockResponse();
    await forgotPassword(unknownReq, unknownRes as any, () => undefined);
    expect(unknownRes.statusCode).toBe(200);
    expect(unknownRes.jsonData.message).toMatch(/If the email exists/);

    const missingTokenReq = createMockRequest({ password: "NewPassword123!" });
    const missingTokenRes = createMockResponse();
    await resetPassword(
      missingTokenReq,
      missingTokenRes as any,
      () => undefined,
    );
    expect(missingTokenRes.statusCode).toBe(400);
    expect(missingTokenRes.jsonData.message).toMatch(
      /Token and password are required/,
    );

    const missingPasswordReq = createMockRequest({ token: "some-token" });
    const missingPasswordRes = createMockResponse();
    await resetPassword(
      missingPasswordReq,
      missingPasswordRes as any,
      () => undefined,
    );
    expect(missingPasswordRes.statusCode).toBe(400);
    expect(missingPasswordRes.jsonData.message).toMatch(
      /Token and password are required/,
    );

    const missingEmailReq = createMockRequest({});
    const missingEmailRes = createMockResponse();
    await forgotPassword(
      missingEmailReq,
      missingEmailRes as any,
      () => undefined,
    );
    expect(missingEmailRes.statusCode).toBe(400);
    expect(missingEmailRes.jsonData.message).toMatch(/Email is required/);
  });
});
