require("ts-node/register/transpile-only");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const testStorageDir = path.join(os.tmpdir(), "cos30049-ctip-tests");
const testStoragePath = path.join(
  testStorageDir,
  `registration-controller-${process.pid}.sqlite`,
);

fs.mkdirSync(testStorageDir, { recursive: true });
if (fs.existsSync(testStoragePath)) {
  fs.unlinkSync(testStoragePath);
}

process.env.DB_DIALECT = "sqlite";
process.env.DB_STORAGE = testStoragePath;

const sequelize = require("../src/config/Database").default;
require("../src/models");

const { UserRoles } = require("../src/enum/UserRoles");
const { RegistrationStatus } = require("../src/enum/RegistrationStatus");
const Registration = require("../src/models/Registration").default;
const User = require("../src/models/User").default;
const RegistrationController = require("../src/controllers/RegistrationController");

function buildRegistrationPayload(overrides = {}) {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    user_id: overrides.user_id,
    reviewed_by_user_id: overrides.reviewed_by_user_id,
    status: overrides.status,
    firstname: overrides.firstname ?? "Alice",
    lastname: overrides.lastname ?? "Nguyen",
    identification: overrides.identification ?? `ID-${unique}`,
    personal_email: overrides.personal_email ?? `alice-${unique}@example.com`,
    tel: overrides.tel ?? "0123456789",
    admin_remark: overrides.admin_remark,
    reviewed_at: overrides.reviewed_at,
  };
}

async function createUser(overrides = {}) {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return User.create({
    username: overrides.username ?? `user-${unique}`,
    firstname: overrides.firstname ?? "Test",
    lastname: overrides.lastname ?? "User",
    identification: overrides.identification ?? `U-${unique}`,
    personal_email: overrides.personal_email ?? `user-${unique}@example.com`,
    role: overrides.role ?? UserRoles.ADMIN,
    password_hash: overrides.password_hash ?? "hash",
    last_login_at: overrides.last_login_at ?? null,
  });
}

function createMockResponse() {
  const state = {
    statusCode: 200,
    body: undefined,
  };

  const response = {
    status(code) {
      state.statusCode = code;
      return response;
    },
    json(payload) {
      state.body = payload;
      return response;
    },
  };

  return { response, state };
}

function createNext() {
  return (err) => {
    if (err) {
      throw err;
    }
  };
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

test("createRegistration persists a new registration", async () => {
  const user = await createUser();
  const reviewer = await createUser({ username: `reviewer-${user.id}` });
  const payload = buildRegistrationPayload({
    user_id: user.id,
    reviewed_by_user_id: reviewer.id,
    status: RegistrationStatus.APPROVED,
    admin_remark: "Checked by admin",
    reviewed_at: "2026-04-28T08:30:00.000Z",
  });

  const { response, state } = createMockResponse();

  await RegistrationController.createRegistration(
    { body: payload },
    response,
    createNext(),
  );

  assert.equal(state.statusCode, 201);
  assert.equal(state.body.firstname, payload.firstname);
  assert.equal(state.body.lastname, payload.lastname);
  assert.equal(state.body.status, RegistrationStatus.APPROVED);
  assert.equal(state.body.user_id, user.id);
  assert.equal(state.body.reviewed_by_user_id, reviewer.id);
  assert.equal(state.body.admin_remark, payload.admin_remark);
  assert.ok(state.body.reviewed_at instanceof Date);

  const createdRegistration = await Registration.findByPk(state.body.id, {
    paranoid: false,
  });

  assert.ok(createdRegistration);
  assert.equal(createdRegistration.user_id, user.id);
  assert.equal(createdRegistration.reviewed_by_user_id, reviewer.id);
  assert.equal(createdRegistration.status, RegistrationStatus.APPROVED);
  assert.equal(createdRegistration.admin_remark, payload.admin_remark);
});

test("getAllRegistrations returns registrations from the database", async () => {
  const user = await createUser();
  const first = await Registration.create({
    user_id: user.id,
    status: RegistrationStatus.PENDING,
    firstname: "First",
    lastname: "Registration",
    identification: "REG-001",
    personal_email: "first@example.com",
    tel: "1111111111",
    admin_remark: null,
    reviewed_at: null,
  });
  const second = await Registration.create({
    user_id: user.id,
    status: RegistrationStatus.REJECTED,
    firstname: "Second",
    lastname: "Registration",
    identification: "REG-002",
    personal_email: "second@example.com",
    tel: "2222222222",
    admin_remark: "Needs more info",
    reviewed_at: null,
  });

  const { response, state } = createMockResponse();

  await RegistrationController.getAllRegistrations(
    {
      query: {},
      protocol: "http",
      get: (header) => (header === "host" ? "localhost:5000" : undefined),
      originalUrl: "/api/registrations",
    },
    response,
    createNext(),
  );

  assert.equal(state.statusCode, 200);
  assert.equal(state.body.page, 1);
  assert.equal(state.body.size, 20);
  assert.equal(state.body.totalElements, 2);
  assert.equal(state.body.totalPages, 1);
  assert.equal(state.body.data.length, 2);
  assert.deepEqual(
    state.body.data.map((registration) => registration.id).sort(),
    [first.id, second.id].sort(),
  );

  const selfLink = state.body._links.self.href;
  assert.ok(selfLink.includes("/api/registrations?page=1&size=20"));
});

test("getRegistrationById returns a single registration", async () => {
  const user = await createUser();
  const registration = await Registration.create({
    user_id: user.id,
    status: RegistrationStatus.PENDING,
    firstname: "Lookup",
    lastname: "Target",
    identification: "REG-LOOKUP",
    personal_email: "lookup@example.com",
    tel: "3333333333",
    admin_remark: null,
    reviewed_at: null,
  });

  const { response, state } = createMockResponse();

  await RegistrationController.getRegistrationById(
    { params: { id: String(registration.id) } },
    response,
    createNext(),
  );

  assert.equal(state.statusCode, 200);
  assert.equal(state.body.id, registration.id);
  assert.equal(state.body.firstname, "Lookup");
  assert.equal(state.body.personal_email, "lookup@example.com");
});

test("updateRegistration persists allowed field changes", async () => {
  const user = await createUser();
  const registration = await Registration.create({
    user_id: user.id,
    status: RegistrationStatus.PENDING,
    firstname: "Original",
    lastname: "Name",
    identification: "REG-UPDATE",
    personal_email: "update@example.com",
    tel: "4444444444",
    admin_remark: null,
    reviewed_at: null,
  });

  const { response, state } = createMockResponse();

  await RegistrationController.updateRegistration(
    {
      params: { id: String(registration.id) },
      body: {
        firstname: "Updated",
        lastname: "   ",
        status: RegistrationStatus.APPROVED,
        admin_remark: "Reviewed",
        reviewed_at: "2026-04-28T09:00:00.000Z",
        tel: "",
      },
    },
    response,
    createNext(),
  );

  assert.equal(state.statusCode, 200);
  assert.equal(state.body.firstname, "Updated");
  assert.equal(state.body.lastname, "Name");
  assert.equal(state.body.status, RegistrationStatus.APPROVED);
  assert.equal(state.body.admin_remark, "Reviewed");
  assert.ok(state.body.reviewed_at instanceof Date);

  const updatedRegistration = await Registration.findByPk(registration.id, {
    paranoid: false,
  });

  assert.ok(updatedRegistration);
  assert.equal(updatedRegistration.firstname, "Updated");
  assert.equal(updatedRegistration.lastname, "Name");
  assert.equal(updatedRegistration.status, RegistrationStatus.APPROVED);
  assert.equal(updatedRegistration.admin_remark, "Reviewed");
  assert.equal(updatedRegistration.tel, "4444444444");
});

test("deleteRegistration soft deletes the row", async () => {
  const user = await createUser();
  const registration = await Registration.create({
    user_id: user.id,
    status: RegistrationStatus.PENDING,
    firstname: "Delete",
    lastname: "Me",
    identification: "REG-DELETE",
    personal_email: "delete@example.com",
    tel: "5555555555",
    admin_remark: null,
    reviewed_at: null,
  });

  const { response, state } = createMockResponse();

  await RegistrationController.deleteRegistration(
    { params: { id: String(registration.id) } },
    response,
    createNext(),
  );

  assert.equal(state.statusCode, 200);
  assert.equal(state.body.message, "Registration deleted successfully");

  const activeRegistration = await Registration.findByPk(registration.id);
  const deletedRegistration = await Registration.findByPk(registration.id, {
    paranoid: false,
  });

  assert.equal(activeRegistration, null);
  assert.ok(deletedRegistration);
  assert.ok(deletedRegistration.deleted_at instanceof Date);
});
