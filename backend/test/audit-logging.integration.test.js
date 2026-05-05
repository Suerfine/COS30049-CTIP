require("ts-node/register/transpile-only");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const test = require("node:test");

const testStorageDir = path.join(os.tmpdir(), "cos30049-ctip-tests");
const testStoragePath = path.join(
  testStorageDir,
  `audit-logging-${process.pid}.sqlite`,
);

fs.mkdirSync(testStorageDir, { recursive: true });
if (fs.existsSync(testStoragePath)) {
  fs.unlinkSync(testStoragePath);
}

process.env.DB_DIALECT = "sqlite";
process.env.DB_STORAGE = testStoragePath;

const sequelize = require("../src/config/Database").default;
require("../src/models");

const AuditLog = require("../src/models/AuditLog").default;
const User = require("../src/models/User").default;
const { UserRoles } = require("../src/enum/UserRoles");
const { auditLogger } = require("../src/middelware/AuditLogger");

async function createUser(overrides = {}) {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return User.create({
    username: overrides.username ?? `audit-user-${unique}`,
    firstname: overrides.firstname ?? "Audit",
    lastname: overrides.lastname ?? "Tester",
    identification: overrides.identification ?? `A-${unique}`,
    personal_email: overrides.personal_email ?? `audit-${unique}@example.com`,
    tel: overrides.tel ?? "0100000000",
    role: overrides.role ?? UserRoles.ADMIN,
    password_hash: overrides.password_hash ?? "hash",
    last_login_at: null,
  });
}

function buildResponseMock() {
  class MockResponse extends EventEmitter {
    constructor() {
      super();
      this.statusCode = 200;
      this._headers = {};
    }

    status(code) {
      this.statusCode = code;
      return this;
    }

    get(headerName) {
      return this._headers[String(headerName).toLowerCase()];
    }

    set(headerName, value) {
      this._headers[String(headerName).toLowerCase()] = value;
      return this;
    }

    json(body) {
      this.body = body;
      return this;
    }

    send(body) {
      this.body = body;
      return this;
    }
  }

  return new MockResponse();
}

async function resetDatabase() {
  await sequelize.drop();
  await sequelize.sync();
}

test.before(async () => {
  await sequelize.authenticate();
});

test.beforeEach(async () => {
  await resetDatabase();
});

test.after(async () => {
  await sequelize.close();
  if (fs.existsSync(testStoragePath)) {
    fs.unlinkSync(testStoragePath);
  }
});

test("SCRUM-254: audit log schema includes required columns", async () => {
  const requiredColumns = [
    "id",
    "user_id",
    "event_type",
    "action",
    "resource_type",
    "resource_id",
    "method",
    "path",
    "status_code",
    "ip_address",
    "user_agent",
    "request_data",
    "response_data",
    "created_at",
    "updated_at",
  ];

  const columns = Object.keys(AuditLog.rawAttributes);
  for (const column of requiredColumns) {
    assert.ok(
      columns.includes(column),
      `Expected audit_logs to include column: ${column}`,
    );
  }
});

test("SCRUM-255: middleware writes audit row for API operation", async () => {
  const user = await createUser();
  const req = {
    method: "GET",
    path: "/users/me",
    originalUrl: "/api/users/me",
    params: {},
    query: {},
    body: {},
    user,
    ip: "127.0.0.1",
    headers: {},
    get: (name) => {
      if (String(name).toLowerCase() === "user-agent") {
        return "audit-test-agent";
      }
      return undefined;
    },
  };

  const res = buildResponseMock();

  await new Promise((resolve, reject) => {
    auditLogger(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

  res.status(200).json({ message: "ok" });
  res.emit("finish");

  // Give the asynchronous insert a moment to complete.
  await new Promise((resolve) => setTimeout(resolve, 25));

  const log = await AuditLog.findOne({ order: [["id", "DESC"]] });
  assert.ok(log, "Expected an audit log row to be created");
  assert.equal(log.user_id, user.id);
  assert.equal(log.action, "READ");
  assert.equal(log.method, "GET");
  assert.equal(log.path, "/api/users/me");
  assert.equal(log.status_code, 200);
  assert.equal(log.event_type, "SENSITIVE_DATA_READ");
});

test("SCRUM-256: middleware sanitizes sensitive fields in logs", async () => {
  const user = await createUser();
  const req = {
    method: "POST",
    path: "/reset-password",
    originalUrl: "/api/reset-password",
    params: {},
    query: {},
    body: {
      email: "private@example.com",
      password: "PlainText123!",
      tel: "0123456789",
      token: "raw-reset-token",
      note: "safe-field",
    },
    user,
    ip: "127.0.0.1",
    headers: {},
    get: (name) => {
      if (String(name).toLowerCase() === "user-agent") {
        return "audit-test-agent";
      }
      return undefined;
    },
  };

  const res = buildResponseMock();

  await new Promise((resolve, reject) => {
    auditLogger(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

  res.status(200).json({
    message: "Password reset successfully",
    token: "response-token",
    email: "private@example.com",
  });
  res.emit("finish");

  await new Promise((resolve) => setTimeout(resolve, 25));

  const log = await AuditLog.findOne({ order: [["id", "DESC"]] });
  assert.ok(log, "Expected an audit log row to be created");
  assert.equal(log.event_type, "PASSWORD_RESET_COMPLETE");
  assert.equal(log.action, "CREATE");

  const requestBody = log.request_data?.body;
  const responseData = log.response_data;

  assert.equal(requestBody.note, "safe-field");
  assert.equal(requestBody.password, "***REDACTED***");
  assert.equal(requestBody.token, "***REDACTED***");
  assert.equal(requestBody.tel, "***6789");
  assert.equal(requestBody.email, "pr***@example.com");

  assert.equal(responseData.token, "***REDACTED***");
  assert.equal(responseData.email, "pr***@example.com");
});
