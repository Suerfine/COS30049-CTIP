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
import { getMailer } from "../../src/services/mailer";

const ADMIN_PASSWORD = "Admin123!";
const ADMIN_LOGIN_USERNAME = "admin@sfc.com.my"; // For legacy purpose login is using email as username
const CREATED_ADMIN_PASSWORD = "Admin456!";
faker.seed(); // Seed faker for consistent test data

const mailer = getMailer();

function generateSfcEmail(user: User): string {
  return mailer.generateSfcEmail(user.id);
}

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
      username: generateSfcEmail(adminUser),
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

    // Test for login with the newly created admin user
    const loginResponse = await request(app)
      .post("/api/token")
      .type("form")
      .send({
        username: generateSfcEmail(createdUser!),
        password: createdPassword,
      });
    expect(loginResponse.status).toBe(200);
  });

  it("POST /api/users - fails to create an admin user when authenticated as non-admin", async () => {
    // Create a non-admin user to test with
    const ParkGuideUsername = faker.internet.username();
    const ParkGuideEmail = faker.internet.email().toLocaleLowerCase();
    const ParkGuidePassword = faker.internet.password();
    const user = await User.create({
      username: ParkGuideUsername,
      firstname: "Park",
      lastname: "Guide",
      identification: `${ParkGuideUsername}-id`,
      personal_email: ParkGuideEmail,
      tel: "0123456789",
      role: UserRoles.PARK_GUIDE,
      password_hash: await hashPassword(ParkGuidePassword),
    });
    const accessToken = await login({
      username: generateSfcEmail(user),
      password: ParkGuidePassword,
    });

    // Attempt to create an admin user with a non-admin access token, expect it to fail with a 403 Forbidden status
    const createdUsername = faker.internet.username();
    const createdEmail = faker.internet.email().toLocaleLowerCase();
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
    expect(response.status).toBe(403);

    // Ensure the user was not created
    const createdUser = await User.findOne({
      where: { username: createdUsername },
    });
    expect(createdUser).toBeNull();
  });

  it("GET /api/users - returns the paginated user list", async () => {
    await createAdminUser();
    const accessToken = await login({
      username: ADMIN_LOGIN_USERNAME,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.totalElements).toBe(1);
  });

  it("GET /api/users/me - returns the current authenticated user", async () => {
    const adminUser = await createAdminUser();
    const accessToken = await login({
      username: ADMIN_LOGIN_USERNAME,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(adminUser.id);
    expect(response.body.personal_email).toBe(ADMIN_LOGIN_USERNAME);
  });

  it("GET /api/users/search/:name/:limit - searches users by username", async () => {
    await createAdminUser();
    await User.create({
      username: "searchable-guide",
      firstname: "Searchable",
      lastname: "Guide",
      identification: "searchable-guide-id",
      personal_email: "searchable.guide@example.com",
      tel: "0123456789",
      role: UserRoles.PARK_GUIDE,
      password_hash: await hashPassword("pass123"),
    });
    const accessToken = await login({
      username: ADMIN_LOGIN_USERNAME,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .get("/api/users/search/searchable/5")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].username).toBe("searchable-guide");
  });

  it("GET /api/users/:id - returns a specific user by id", async () => {
    const adminUser = await createAdminUser();
    const accessToken = await login({
      username: ADMIN_LOGIN_USERNAME,
      password: ADMIN_PASSWORD,
    });

    const response = await request(app)
      .get(`/api/users/${adminUser.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(adminUser.id);
  });

  it("PUT /api/users/:id - updates an details when authenticated as themselves", async () => {
    const user = await User.create({
      username: faker.internet.username(),
      firstname: "Test",
      lastname: "User",
      identification: `testuser-id`,
      personal_email: faker.internet.email().toLocaleLowerCase(),
      tel: "0123456789",
      role: UserRoles.PARK_GUIDE,
      password_hash: await hashPassword("pass"),
    });

    // Login as the created user
    const sfc_user_email = generateSfcEmail(user);
    const accessToken = await login({
      username: sfc_user_email,
      password: "pass",
    });

    // Attempt to update the user's own details
    const newFirstname = "Updated";
    const newLastname = "User";
    const newTel = "0987654321";
    const newPassword = "newpass";
    const response = await request(app)
      .put(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        firstname: newFirstname,
        lastname: newLastname,
        tel: newTel,
        password: newPassword,
      });
    expect(response.status).toBe(200);

    // Ensure the user's details were updated
    const updatedUser = await User.findByPk(user.id);
    expect(updatedUser).not.toBeNull();
    expect(updatedUser?.firstname).toBe(newFirstname);
    expect(updatedUser?.lastname).toBe(newLastname);
    expect(updatedUser?.tel).toBe(newTel);
  });

  it("PUT /api/users/:id - fails to update another user's details when authenticated as non-admin", async () => {
    // Create two users
    const user1 = await User.create({
      username: faker.internet.username(),
      firstname: "User",
      lastname: "One",
      identification: `user1-id`,
      personal_email: faker.internet.email().toLocaleLowerCase(),
      tel: "0123456789",
      role: UserRoles.PARK_GUIDE,
      password_hash: await hashPassword("pass1"),
    });
    const user2 = await User.create({
      username: faker.internet.username(),
      firstname: "User",
      lastname: "Two",
      identification: `user2-id`,
      personal_email: faker.internet.email().toLocaleLowerCase(),
      tel: "0123456789",
      role: UserRoles.PARK_GUIDE,
      password_hash: await hashPassword("pass2"),
    });

    // Login as user1
    const accessToken = await login({
      username: generateSfcEmail(user1),
      password: "pass1",
    });

    // Attempt to update user2's details with user1's access token, expect it to fail with a 403 Forbidden status
    const response = await request(app)
      .put(`/api/users/${user2.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        firstname: "Hacked",
        lastname: "User",
        tel: "0987654321",
        password: "hackedpass",
      });
    expect(response.status).toBe(403);

    // Ensure user2's details were not updated
    const updatedUser2 = await User.findByPk(user2.id);
    expect(updatedUser2).not.toBeNull();
    expect(updatedUser2?.firstname).toBe("User");
    expect(updatedUser2?.lastname).toBe("Two");
    expect(updatedUser2?.tel).toBe("0123456789");
  });

  it("PUT /api/users/:id - updates another user's details when authenticated as admin", async () => {
    const adminUser = await createAdminUser();
    const accessToken = await login({
      username: generateSfcEmail(adminUser),
      password: ADMIN_PASSWORD,
    });

    // Create another user to update
    const user = await User.create({
      username: faker.internet.username(),
      firstname: "Test",
      lastname: "User",
      identification: `testuser-id`,
      personal_email: faker.internet.email().toLocaleLowerCase(),
      tel: "0123456789",
      role: UserRoles.PARK_GUIDE,
      password_hash: await hashPassword("pass"),
    });

    // Attempt to update the user's details with admin access token
    const newFirstname = "AdminUpdated";
    const newLastname = "User";
    const newTel = "0987654321";
    const newPassword = "newpass";
    const response = await request(app)
      .put(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        firstname: newFirstname,
        lastname: newLastname,
        tel: newTel,
        password: newPassword,
      });
    expect(response.status).toBe(200);

    // Ensure the user's details were updated
    const updatedUser = await User.findByPk(user.id);
    expect(updatedUser).not.toBeNull();
    expect(updatedUser?.firstname).toBe(newFirstname);
    expect(updatedUser?.lastname).toBe(newLastname);
    expect(updatedUser?.tel).toBe(newTel);
  });

  it("PUT /api/users/:id/change-password - updates the user's password", async () => {
    const user = await User.create({
      username: faker.internet.username(),
      firstname: "Test",
      lastname: "User",
      identification: `testuser-id`,
      personal_email: faker.internet.email().toLocaleLowerCase(),
      tel: "0123456789",
      role: UserRoles.PARK_GUIDE,
      password_hash: await hashPassword("oldpassword"),
    });

    // Login as the created user
    const accessToken = await login({
      username: generateSfcEmail(user),
      password: "oldpassword",
    });

    // Attempt to change the user's password
    const newPassword = "newpassword";
    const response = await request(app)
      .put(`/api/users/${user.id}/change-password`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        old_password: "oldpassword",
        new_password: newPassword,
      });
    expect(response.status).toBe(200);

    // Assert that the user can login with the new password
    const newAccessToken = await login({
      username: generateSfcEmail(user),
      password: "newpassword",
    });
    expect(newAccessToken).toBeDefined();
  });

  it("PUT /api/users/:id/change-password - fails when old password is wrong", async () => {
    const user = await User.create({
      username: faker.internet.username(),
      firstname: "Test",
      lastname: "User",
      identification: "wrong-old-password-id",
      personal_email: faker.internet.email().toLocaleLowerCase(),
      tel: "0123456789",
      role: UserRoles.PARK_GUIDE,
      password_hash: await hashPassword("oldpassword"),
    });
    const accessToken = await login({
      username: user.personal_email,
      password: "oldpassword",
    });

    const response = await request(app)
      .put(`/api/users/${user.id}/change-password`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        old_password: "wrongpassword",
        new_password: "newpassword",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Old password is incorrect");
  });

  it("DELETE /api/users/:id - soft deletes a user", async () => {
    const user = await User.create({
      username: faker.internet.username(),
      firstname: "Delete",
      lastname: "User",
      identification: "delete-user-id",
      personal_email: faker.internet.email().toLocaleLowerCase(),
      tel: "0123456789",
      role: UserRoles.PARK_GUIDE,
      password_hash: await hashPassword("pass123"),
    });

    const response = await request(app).delete(`/api/users/${user.id}`);

    expect(response.status).toBe(200);
    expect(await User.findByPk(user.id)).toBeNull();
  });
});
