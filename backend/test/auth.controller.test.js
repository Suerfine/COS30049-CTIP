require("ts-node/register/transpile-only");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const crypto = require("crypto");

const testStorageDir = path.join(os.tmpdir(), "cos30049-ctip-tests");
const testStoragePath = path.join(
  testStorageDir,
  `auth-controller-${process.pid}.sqlite`,
);

fs.mkdirSync(testStorageDir, { recursive: true });
if (fs.existsSync(testStoragePath)) {
  fs.unlinkSync(testStoragePath);
}

process.env.DB_DIALECT = "sqlite";
process.env.DB_STORAGE = testStoragePath;
process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.FRONTEND_URL = "http://localhost:8081";
process.env.SMTP_HOST = "smtp.test.com";
process.env.SMTP_USER = "test@test.com";
process.env.SMTP_PASS = "password";
process.env.SMTP_FROM = "noreply@test.com";

const sequelize = require("../src/config/Database").default;
require("../src/models");

const User = require("../src/models/User").default;
const PasswordResetToken = require("../src/models/PasswordResetToken").default;
const { token, forgotPassword, resetPassword } = require("../src/controllers/AuthController");
const { hashPassword } = require("../src/utils/password");

async function setupTestDatabase() {
  await sequelize.sync({ force: true });
  
  // Create password_reset_tokens table manually
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash VARCHAR(255) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

async function createTestUser(email = "testuser@example.com") {
  const hashedPassword = hashPassword("OldPassword123!");
  return await User.create({
    username: "testuser",
    firstname: "Test",
    lastname: "User",
    identification: "testuser",
    personal_email: email,
    tel: "0123456789",
    role: "learner",
    password_hash: hashedPassword,
  });
}

function createMockRequest(body = {}) {
  return { body };
}

function createMockResponse() {
  const response = {
    statusCode: null,
    jsonData: null,
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.jsonData = data;
      return this;
    },
  };
  return response;
}

test("Password Reset Flow - Full Integration", async (t) => {
  await setupTestDatabase();

  await t.test("should request password reset and create token record", async () => {
    const user = await createTestUser("testuser@example.com");
    
    const req = createMockRequest({
      email: "testuser@example.com",
    });
    const res = createMockResponse();
    
    await forgotPassword(req, res, () => {});
    
    assert.equal(res.statusCode, 200);
    assert.match(res.jsonData.message, /If the email exists/);
    
    // Verify token was created in DB
    const tokenRecords = await PasswordResetToken.findAll({
      where: { user_id: user.id },
    });
    assert.equal(tokenRecords.length, 1);
    assert.ok(tokenRecords[0].token_hash);
    assert.ok(tokenRecords[0].expires_at);
    assert.equal(tokenRecords[0].used_at, null);
  });

  await t.test("should reset password with valid token", async () => {
    const user = await createTestUser("user2@example.com");
    
    // Step 1: Request password reset
    const req1 = createMockRequest({
      email: "user2@example.com",
    });
    const res1 = createMockResponse();
    await forgotPassword(req1, res1, () => {});
    
    // Step 2: Get the token record from DB
    const tokenRecord = await PasswordResetToken.findOne({
      where: { user_id: user.id },
    });
    assert.ok(tokenRecord);
    
    // Step 3: To test, we need to recreate the plaintext token
    // In real scenario, user would have it from email
    // For testing, we'll create a new token and insert it
    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");
    
    await PasswordResetToken.update(
      { token_hash: tokenHash },
      { where: { id: tokenRecord.id } }
    );
    
    // Step 4: Reset password with valid token
    const newPassword = "NewPassword123!";
    const req2 = createMockRequest({
      token: plainToken,
      password: newPassword,
    });
    const res2 = createMockResponse();
    await resetPassword(req2, res2, () => {});
    
    assert.equal(res2.statusCode, 200);
    assert.match(res2.jsonData.message, /Password reset successfully/);
    
    // Step 5: Verify token is marked as used
    const updatedToken = await PasswordResetToken.findOne({
      where: { id: tokenRecord.id },
    });
    assert.ok(updatedToken.used_at);
    
    // Step 6: Verify user can login with new password
    const req3 = createMockRequest({
      username: "user2@sfc.gov.my",
      password: newPassword,
    });
    const res3 = createMockResponse();
    await token(req3, res3, () => {});
    
    assert.equal(res3.statusCode, 200);
    assert.ok(res3.jsonData.access_token);
  });

  await t.test("should reject reused token", async () => {
    const user = await createTestUser("user3@example.com");
    
    // Create a token
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
    
    // First reset - should succeed
    const req1 = createMockRequest({
      token: plainToken,
      password: "FirstReset123!",
    });
    const res1 = createMockResponse();
    await resetPassword(req1, res1, () => {});
    assert.equal(res1.statusCode, 200);
    
    // Second reset with same token - should fail
    const req2 = createMockRequest({
      token: plainToken,
      password: "SecondReset123!",
    });
    const res2 = createMockResponse();
    await resetPassword(req2, res2, () => {});
    
    assert.equal(res2.statusCode, 400);
    assert.match(res2.jsonData.message, /already been used/);
  });

  await t.test("should reject expired token", async () => {
    const user = await createTestUser("user4@example.com");
    
    // Create an expired token
    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");
    
    await PasswordResetToken.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() - 1000), // Expired 1 second ago
    });
    
    const req = createMockRequest({
      token: plainToken,
      password: "NewPassword123!",
    });
    const res = createMockResponse();
    await resetPassword(req, res, () => {});
    
    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData.message, /Invalid or expired/);
  });

  await t.test("should reject invalid token", async () => {
    const req = createMockRequest({
      token: "invalid-token-that-does-not-exist",
      password: "NewPassword123!",
    });
    const res = createMockResponse();
    await resetPassword(req, res, () => {});
    
    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData.message, /Invalid or expired/);
  });

  await t.test("should handle non-existent email gracefully", async () => {
    const req = createMockRequest({
      email: "nonexistent@example.com",
    });
    const res = createMockResponse();
    
    await forgotPassword(req, res, () => {});
    
    // Should return success even if email doesn't exist (security best practice)
    assert.equal(res.statusCode, 200);
    assert.match(res.jsonData.message, /If the email exists/);
  });

  await t.test("should reject missing token or password", async () => {
    // Missing token
    const req1 = createMockRequest({
      password: "NewPassword123!",
    });
    const res1 = createMockResponse();
    await resetPassword(req1, res1, () => {});
    assert.equal(res1.statusCode, 400);
    assert.match(res1.jsonData.message, /Token and password are required/);
    
    // Missing password
    const req2 = createMockRequest({
      token: "some-token",
    });
    const res2 = createMockResponse();
    await resetPassword(req2, res2, () => {});
    assert.equal(res2.statusCode, 400);
    assert.match(res2.jsonData.message, /Token and password are required/);
  });

  await t.test("should reject missing email in forgot-password", async () => {
    const req = createMockRequest({});
    const res = createMockResponse();
    
    await forgotPassword(req, res, () => {});
    
    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData.message, /Email is required/);
  });
});
