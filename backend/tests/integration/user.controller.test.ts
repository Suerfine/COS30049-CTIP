import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import app from "../../src/server";
import { User } from "../../src/models";
import { UserRoles } from "../../src/enum/UserRoles";
import { hashPassword } from "../../src/utils/password";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";
import { faker, Faker } from "@faker-js/faker";
import { beforeEach } from "node:test";

const ADMIN_PASSWORD = "Admin123!";
const ADMIN_LOGIN_USERNAME = "admin@sfc.com.my"; // For legacy purpose login is using email as username
const CREATED_ADMIN_PASSWORD = "Admin456!";
faker.seed(); // Seed faker for consistent test data

function dumpHttpResponse(label: string, response: SupertestResponse): void {
  console.error(`${label} response:`, {
    status: response.status,
    body: response.body,
    text: response.text,
    headers: response.headers,
  });
}

async function createAdminUser(): Promise<User> {
  return await User.create({
    username: "admin",
    firstname: "Seed",
    lastname: "Admin",
    identification: `admin-id`,
    personal_email: ADMIN_LOGIN_USERNAME,
    tel: "0123456789",
    role: UserRoles.ADMIN,
    password_hash: hashPassword(ADMIN_PASSWORD),
  });
}
describe("User Controller Integration Tests", () => {
  it("POST /api/users - creates an admin user when authenticated as admin", async () => {
    const adminUser = await createAdminUser();
    const accessToken = await login({
      username: ADMIN_LOGIN_USERNAME,
      password: ADMIN_PASSWORD,
    });

    const createdUsername = faker.internet.username();
    const createdEmail = `${createdUsername}@example.com`.toLowerCase();
    const createdPassword = faker.internet.password();
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        username: createdUsername,
        password: createdPassword,
        role: UserRoles.ADMIN,
        firstname: "Created",
        lastname: "Admin",
        identification: `${createdUsername}-id`,
        personal_email: createdEmail,
        tel: "0987654321",
      });

    expect(response.status).toBe(201);
    expect(response.body.username).toBe(createdUsername);
    expect(response.body.role).toBe(UserRoles.ADMIN);

    const createdUser = await User.findOne({
      where: { username: createdUsername },
    });

    expect(createdUser).not.toBeNull();
    expect(createdUser?.role).toBe(UserRoles.ADMIN);
    expect(createdUser?.personal_email).toBe(createdEmail);
    expect(createdUser?.password_hash).toBe(
      await hashPassword(createdPassword),
    );

    // Test for login with the newly created admin user
    const loginResponse = await request(app)
      .post("/api/token")
      .type("form")
      .send({
        username: createdEmail,
        password: createdPassword,
      });
    expect(loginResponse.status).toBe(200);
  });
});
