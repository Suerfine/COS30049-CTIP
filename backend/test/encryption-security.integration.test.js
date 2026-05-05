require("ts-node/register/transpile-only");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const testStorageDir = path.join(os.tmpdir(), "cos30049-ctip-tests");
const testStoragePath = path.join(
  testStorageDir,
  `encryption-security-${process.pid}.sqlite`,
);

fs.mkdirSync(testStorageDir, { recursive: true });
if (fs.existsSync(testStoragePath)) {
  fs.unlinkSync(testStoragePath);
}

process.env.DB_DIALECT = "sqlite";
process.env.DB_STORAGE = testStoragePath;
process.env.DATA_ENCRYPTION_KEY = "test-only-32-byte-encryption-key-material";

const sequelize = require("../src/config/Database").default;
require("../src/models");

const User = require("../src/models/User").default;
const Registration = require("../src/models/Registration").default;
const Course = require("../src/models/Course").default;
const Module = require("../src/models/Module").default;
const Page = require("../src/models/Page").default;
const Element = require("../src/models/Element").default;
const Enrollment = require("../src/models/Enrollment").default;
const Submission = require("../src/models/Submissions").default;
const { UserRoles } = require("../src/enum/UserRoles");
const { EnrollmentStatus } = require("../src/enum/EnrollmentStatus");
const { ElementTypes } = require("../src/enum/ElementTypes");
const {
  decryptAssessmentDataForRole,
} = require("../src/utils/assessmentData");
const {
  getDecryptedSubmissionById,
} = require("../src/controllers/SubmissionController");

async function resetDatabase() {
  await sequelize.drop();
  await sequelize.sync();
}

async function createUser(overrides = {}) {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return User.create({
    username: overrides.username ?? `secure-user-${unique}`,
    firstname: overrides.firstname ?? "Secure",
    lastname: overrides.lastname ?? "User",
    identification: overrides.identification ?? `ID-${unique}`,
    personal_email: overrides.personal_email ?? `secure-${unique}@example.com`,
    tel: overrides.tel ?? "0123456789",
    role: overrides.role ?? UserRoles.ADMIN,
    password_hash: overrides.password_hash ?? "hash",
    last_login_at: null,
  });
}

async function createSubmissionFixture(user) {
  const course = await Course.create({ title: "Security Course" });
  const module = await Module.create({
    course_id: course.id,
    order: 1,
    title: "Module 1",
    complete_by_week: 1,
  });
  const page = await Page.create({
    module_id: module.id,
    order: 1,
    title: "Page 1",
  });
  const element = await Element.create({
    page_id: page.id,
    order: 1,
    type: ElementTypes.QUIZ_OBJECTIVE,
    content: { question: "Q1" },
  });
  const enrollment = await Enrollment.create({
    user_id: user.id,
    course_id: course.id,
    status: EnrollmentStatus.IN_PROGRESS,
  });

  return Submission.create({
    enrollment_id: enrollment.id,
    element_id: element.id,
    data: {
      answer: "B",
      score_reason: "Correct concept mapping",
      examiner_note: "Confidential",
    },
    earned_grade: 9,
  });
}

function createMockResponse() {
  const state = {
    statusCode: 200,
    body: null,
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

test("SCRUM-259/261: user PII is encrypted at rest but transparently readable in app", async () => {
  const user = await createUser({
    identification: "900101015555",
    personal_email: "private.person@example.com",
    tel: "0199988776",
  });

  const [rows] = await sequelize.query(
    "SELECT identification, personal_email, tel FROM users WHERE id = ?",
    { replacements: [user.id] },
  );

  const rawUser = rows[0];
  assert.ok(rawUser.identification.startsWith("enc:v1:"));
  assert.ok(rawUser.personal_email.startsWith("enc:v1:"));
  assert.ok(rawUser.tel.startsWith("enc:v1:"));
  assert.notEqual(rawUser.identification, "900101015555");
  assert.notEqual(rawUser.personal_email, "private.person@example.com");
  assert.notEqual(rawUser.tel, "0199988776");

  const fetchedUser = await User.findByPk(user.id);
  assert.ok(fetchedUser);
  assert.equal(fetchedUser.identification, "900101015555");
  assert.equal(fetchedUser.personal_email, "private.person@example.com");
  assert.equal(fetchedUser.tel, "0199988776");
});

test("SCRUM-259/261: registration personal data is encrypted at rest", async () => {
  const registration = await Registration.create({
    status: "pending",
    firstname: "Aida",
    lastname: "Yusof",
    identification: "010203145566",
    personal_email: "aida.yusof@example.com",
    tel: "0131122334",
  });

  const [rows] = await sequelize.query(
    "SELECT firstname, lastname, identification, personal_email, tel FROM registrations WHERE id = ?",
    { replacements: [registration.id] },
  );

  const rawRegistration = rows[0];
  assert.ok(rawRegistration.firstname.startsWith("enc:v1:"));
  assert.ok(rawRegistration.lastname.startsWith("enc:v1:"));
  assert.ok(rawRegistration.identification.startsWith("enc:v1:"));
  assert.ok(rawRegistration.personal_email.startsWith("enc:v1:"));
  assert.ok(rawRegistration.tel.startsWith("enc:v1:"));

  const fetched = await Registration.findByPk(registration.id);
  assert.ok(fetched);
  assert.equal(fetched.firstname, "Aida");
  assert.equal(fetched.lastname, "Yusof");
  assert.equal(fetched.identification, "010203145566");
  assert.equal(fetched.personal_email, "aida.yusof@example.com");
  assert.equal(fetched.tel, "0131122334");
});

test("SCRUM-260: assessment decryption is restricted to authorized role", async () => {
  const user = await createUser();
  const submission = await createSubmissionFixture(user);

  const [rows] = await sequelize.query(
    "SELECT data FROM submissions WHERE id = ?",
    { replacements: [submission.id] },
  );
  const rawData = rows[0].data;

  assert.ok(rawData.startsWith("encr:v1:"));
  assert.ok(!rawData.includes("Confidential"));

  const adminDecrypted = decryptAssessmentDataForRole(rawData, UserRoles.ADMIN);
  assert.equal(adminDecrypted.answer, "B");
  assert.equal(adminDecrypted.examiner_note, "Confidential");

  assert.throws(() => {
    decryptAssessmentDataForRole(rawData, UserRoles.PARK_GUIDE);
  }, /only admins can decrypt assessment data/);
});

test("SCRUM-260: decrypted submission endpoint rejects non-admin and allows admin", async () => {
  const user = await createUser();
  const submission = await createSubmissionFixture(user);

  const parkGuideReq = {
    params: { id: String(submission.id) },
    user: { id: user.id, role: UserRoles.PARK_GUIDE },
  };
  const { response: parkGuideRes, state: parkGuideState } = createMockResponse();

  await getDecryptedSubmissionById(parkGuideReq, parkGuideRes, () => {
    throw new Error("Unexpected next() call for park guide request");
  });

  assert.equal(parkGuideState.statusCode, 403);
  assert.match(parkGuideState.body.message, /only admins can decrypt/i);

  const adminReq = {
    params: { id: String(submission.id) },
    user: { id: user.id, role: UserRoles.ADMIN },
  };
  const { response: adminRes, state: adminState } = createMockResponse();

  await getDecryptedSubmissionById(adminReq, adminRes, () => {
    throw new Error("Unexpected next() call for admin request");
  });

  assert.equal(adminState.statusCode, 200);
  assert.equal(adminState.body.id, submission.id);
  assert.equal(adminState.body.data.examiner_note, "Confidential");
});
