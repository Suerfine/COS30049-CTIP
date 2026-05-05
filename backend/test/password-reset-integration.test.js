/**
 * SCRUM-244: Integration test for the full "Forgot Password" → "Password Updated" flow
 * 
 * This test verifies:
 * 1. User requests password reset via email
 * 2. Token is created in DB with hash, expiry, and used_at null
 * 3. User submits reset password with token and new password
 * 4. Token is marked as used
 * 5. User can login with new password
 * 6. Reusing same token fails
 * 7. Expired tokens are rejected
 */

require("ts-node/register/transpile-only");

const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.FRONTEND_URL = "http://localhost:8081";
process.env.SMTP_HOST = "smtp.test.com";
process.env.SMTP_USER = "test@test.com";
process.env.SMTP_PASS = "password";
process.env.SMTP_FROM = "noreply@test.com";

const testDbPath = path.join(__dirname, "integration-test.sqlite");
process.env.DB_STORAGE = testDbPath;

// Clean up old test DB
const fs = require("fs");
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const sequelize = require("../src/config/Database").default;
require("../src/models");

const User = require("../src/models/User").default;
const PasswordResetToken = require("../src/models/PasswordResetToken").default;
const { token, forgotPassword, resetPassword } = require("../src/controllers/AuthController");
const { hashPassword, verifyPassword } = require("../src/utils/password");

async function setupDB() {
  await sequelize.sync({ force: true });
}

function createMockRequest(body) {
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

async function runIntegrationTests() {
  console.log("\n========== PASSWORD RESET INTEGRATION TESTS ==========\n");

  try {
    await setupDB();
    console.log("✓ Database setup complete\n");

    // TEST 1: Create a test user
    console.log("TEST 1: Create test user");
    const hashedPassword = hashPassword("OldPassword123!");
    const testUser = await User.create({
      username: "integrationtest",
      firstname: "Test",
      lastname: "User",
      identification: "testuser",
      personal_email: "testuser@example.com",
      tel: "0123456789",
      role: "learner",
      password_hash: hashedPassword,
    });
    console.log(`  ✓ User created: ${testUser.personal_email} (ID: ${testUser.id})\n`);

    // TEST 2: Request password reset
    console.log("TEST 2: Request password reset");
    const req1 = createMockRequest({
      email: "testuser@example.com",
    });
    const res1 = createMockResponse();
    await forgotPassword(req1, res1, () => {});
    
    if (res1.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res1.statusCode}: ${JSON.stringify(res1.jsonData)}`);
    }
    console.log(`  ✓ Forgot password request successful\n`);

    // TEST 3: Verify token record was created
    console.log("TEST 3: Verify token record created in DB");
    const tokenRecords = await PasswordResetToken.findAll({
      where: { user_id: testUser.id },
    });
    if (tokenRecords.length === 0) {
      throw new Error("No token record created");
    }
    const tokenRecord = tokenRecords[0];
    console.log(`  ✓ Token record created`);
    console.log(`    - token_hash: ${tokenRecord.token_hash.substring(0, 20)}...`);
    console.log(`    - expires_at: ${tokenRecord.expires_at}`);
    console.log(`    - used_at: ${tokenRecord.used_at}`);
    
    // Verify expiry is ~30 minutes in future
    const expiryTime = new Date(tokenRecord.expires_at).getTime();
    const nowTime = Date.now();
    const diffMinutes = (expiryTime - nowTime) / 60000;
    if (diffMinutes < 29 || diffMinutes > 31) {
      throw new Error(`Token expiry is ${diffMinutes}m, expected ~30m`);
    }
    console.log(`    - expires in: ${Math.round(diffMinutes)}m\n`);

    // TEST 4: Reset password with valid token
    console.log("TEST 4: Reset password with valid token");
    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");
    
    // Update token hash to one we know
    await PasswordResetToken.update(
      { token_hash: tokenHash },
      { where: { id: tokenRecord.id } }
    );
    
    const newPassword = "NewPassword123!";
    const req2 = createMockRequest({
      token: plainToken,
      password: newPassword,
    });
    const res2 = createMockResponse();
    await resetPassword(req2, res2, () => {});
    
    if (res2.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res2.statusCode}: ${JSON.stringify(res2.jsonData)}`);
    }
    console.log(`  ✓ Password reset successful\n`);

    // TEST 5: Verify token is marked as used
    console.log("TEST 5: Verify token marked as used");
    const updatedToken = await PasswordResetToken.findOne({
      where: { id: tokenRecord.id },
    });
    if (!updatedToken.used_at) {
      throw new Error("Token not marked as used");
    }
    console.log(`  ✓ Token marked as used: ${updatedToken.used_at}\n`);

    // TEST 6: Verify new password works for login
    console.log("TEST 6: Login with new password");
    const req3 = createMockRequest({
      username: "testuser@sfc.gov.my",
      password: newPassword,
    });
    const res3 = createMockResponse();
    await token(req3, res3, () => {});
    
    if (res3.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res3.statusCode}: ${JSON.stringify(res3.jsonData)}`);
    }
    if (!res3.jsonData.access_token) {
      throw new Error("No access token returned");
    }
    console.log(`  ✓ Login successful with new password`);
    console.log(`    - access_token: ${res3.jsonData.access_token.substring(0, 30)}...\n`);

    // TEST 7: Reject reused token
    console.log("TEST 7: Reject reused token");
    const req4 = createMockRequest({
      token: plainToken,
      password: "AnotherPassword123!",
    });
    const res4 = createMockResponse();
    await resetPassword(req4, res4, () => {});
    
    if (res4.statusCode !== 400 || !res4.jsonData.message.includes("already been used")) {
      throw new Error(`Expected 400 "already been used", got ${res4.statusCode}: ${JSON.stringify(res4.jsonData)}`);
    }
    console.log(`  ✓ Reused token rejected: "${res4.jsonData.message}"\n`);

    // TEST 8: Reject expired token
    console.log("TEST 8: Reject expired token");
    const testUser2 = await User.create({
      username: "expiredtest",
      firstname: "Expired",
      lastname: "User",
      identification: "expireduser",
      personal_email: "expireduser@example.com",
      tel: "0123456789",
      role: "learner",
      password_hash: hashPassword("OldPassword123!"),
    });
    
    const expiredPlainToken = crypto.randomBytes(32).toString("hex");
    const expiredTokenHash = crypto.createHash("sha256").update(expiredPlainToken).digest("hex");
    
    await PasswordResetToken.create({
      user_id: testUser2.id,
      token_hash: expiredTokenHash,
      expires_at: new Date(Date.now() - 1000), // Expired 1 second ago
    });
    
    const req5 = createMockRequest({
      token: expiredPlainToken,
      password: "NewPassword123!",
    });
    const res5 = createMockResponse();
    await resetPassword(req5, res5, () => {});
    
    if (res5.statusCode !== 400 || !res5.jsonData.message.includes("Invalid or expired")) {
      throw new Error(`Expected 400 "Invalid or expired", got ${res5.statusCode}: ${JSON.stringify(res5.jsonData)}`);
    }
    console.log(`  ✓ Expired token rejected: "${res5.jsonData.message}"\n`);

    // TEST 9: Reject invalid token
    console.log("TEST 9: Reject invalid token");
    const req6 = createMockRequest({
      token: "invalid-token-that-does-not-exist",
      password: "NewPassword123!",
    });
    const res6 = createMockResponse();
    await resetPassword(req6, res6, () => {});
    
    if (res6.statusCode !== 400 || !res6.jsonData.message.includes("Invalid or expired")) {
      throw new Error(`Expected 400 "Invalid or expired", got ${res6.statusCode}: ${JSON.stringify(res6.jsonData)}`);
    }
    console.log(`  ✓ Invalid token rejected: "${res6.jsonData.message}"\n`);

    console.log("========== ALL TESTS PASSED ✓ ==========\n");
    process.exit(0);

  } catch (error) {
    console.error("\n✗ TEST FAILED:\n");
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runIntegrationTests();
