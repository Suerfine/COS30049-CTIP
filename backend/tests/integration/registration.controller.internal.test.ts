import { describe, expect, it } from "@jest/globals";
import * as RegistrationController from "../../src/controllers/RegistrationController";
import { Registration, User } from "../../src/models";
import { RegistrationStatus } from "../../src/enum/RegistrationStatus";
import { UserRoles } from "../../src/enum/UserRoles";

function buildRegistrationPayload(overrides: Record<string, unknown> = {}) {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    user_id: null,
    reviewed_by_user_id: null,
    status: RegistrationStatus.APPROVED,
    firstname: "Alice",
    lastname: "Nguyen",
    identification: `ID-${unique}`,
    personal_email: `alice-${unique}@example.com`,
    tel: "0123456789",
    admin_remark: "Checked by admin",
    reviewed_at: "2026-04-28T08:30:00.000Z",
    ...overrides,
  };
}

async function createUser(overrides: Partial<User> = {}) {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return User.create({
    username: `user-${unique}`,
    firstname: "Test",
    lastname: "User",
    identification: `U-${unique}`,
    personal_email: `user-${unique}@example.com`,
    tel: "0100000000",
    role: UserRoles.ADMIN,
    password_hash: "hash",
    last_login_at: null,
    ...overrides,
  });
}

function createMockResponse() {
  const state = {
    statusCode: 200,
    body: undefined as any,
  };

  const response = {
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      state.body = payload;
      return response;
    },
  };

  return { response: response as any, state };
}

function createNext() {
  return (err?: unknown) => {
    if (err) {
      throw err;
    }
  };
}

describe("Registration Controller Integration (controller-level)", () => {
  it("createRegistration persists a new registration", async () => {
    const payload = buildRegistrationPayload();
    const { response, state } = createMockResponse();

    await RegistrationController.createRegistration(
      {
        body: payload,
        file: {
          mimetype: "application/pdf",
          buffer: Buffer.from("%PDF-1.4 fake"),
          originalname: "registration.pdf",
        },
      } as any,
      response,
      createNext(),
    );

    expect(state.statusCode).toBe(200);
    expect(state.body.firstname).toBe(payload.firstname);
    expect(state.body.lastname).toBe(payload.lastname);
    expect(state.body.status).toBe(RegistrationStatus.PENDING);

    const createdRegistration = await Registration.findByPk(state.body.id, {
      paranoid: false,
    });
    expect(createdRegistration).not.toBeNull();
    expect(createdRegistration?.user_id).toBeNull();
    expect(createdRegistration?.reviewed_by_user_id).toBeNull();
  });

  it("getAllRegistrations returns registrations", async () => {
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
      document_filepath: "private/registrations/test/document.pdf",
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
      document_filepath: "private/registrations/test/document.pdf",
    });

    const { response, state } = createMockResponse();

    await RegistrationController.getAllRegistrations(
      {
        query: {},
        protocol: "http",
        get: (header: string) =>
          header === "host" ? "localhost:5000" : undefined,
        originalUrl: "/api/registrations",
      } as any,
      response,
      createNext(),
    );

    expect(state.statusCode).toBe(200);
    expect(state.body.page).toBe(1);
    expect(state.body.totalElements).toBe(2);
    expect(state.body.data).toHaveLength(2);
    expect(
      state.body.data.map((registration: any) => registration.id).sort(),
    ).toEqual([first.id, second.id].sort());
  });

  it("getRegistrationById returns one registration", async () => {
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
      document_filepath: "private/registrations/test/document.pdf",
    });

    const { response, state } = createMockResponse();

    await RegistrationController.getRegistrationById(
      { params: { id: String(registration.id) } } as any,
      response,
      createNext(),
    );

    expect(state.statusCode).toBe(200);
    expect(state.body.id).toBe(registration.id);
    expect(state.body.firstname).toBe("Lookup");
  });

  it("updateRegistration persists allowed field changes", async () => {
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
      document_filepath: "private/registrations/test/document.pdf",
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
      } as any,
      response,
      createNext(),
    );

    expect(state.statusCode).toBe(200);
    expect(state.body.firstname).toBe("Updated");
    expect(state.body.lastname).toBe("Name");
    expect(state.body.status).toBe(RegistrationStatus.APPROVED);
    expect(state.body.admin_remark).toBe("Reviewed");

    const updatedRegistration = await Registration.findByPk(registration.id, {
      paranoid: false,
    });

    expect(updatedRegistration).not.toBeNull();
    expect(updatedRegistration?.firstname).toBe("Updated");
    expect(updatedRegistration?.lastname).toBe("Name");
    expect(updatedRegistration?.tel).toBe("4444444444");
  });

  it("deleteRegistration soft deletes the row", async () => {
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
      document_filepath: "private/registrations/test/document.pdf",
    });

    const { response, state } = createMockResponse();

    await RegistrationController.deleteRegistration(
      { params: { id: String(registration.id) } } as any,
      response,
      createNext(),
    );

    expect(state.statusCode).toBe(200);
    expect(state.body.message).toBe("Registration deleted successfully");

    const activeRegistration = await Registration.findByPk(registration.id);
    const deletedRegistration = await Registration.findByPk(registration.id, {
      paranoid: false,
    });

    expect(activeRegistration).toBeNull();
    expect(deletedRegistration).not.toBeNull();
    expect(deletedRegistration?.deleted_at).toBeTruthy();
  });
});
