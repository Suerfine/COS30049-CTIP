import request from "supertest";
import app from "../../src/server";
import { Notification, User } from "../../src/models";
import { UserRoles } from "../../src/enum/UserRoles";
import { NotificationCategory } from "../../src/enum/NotificationCategory";
import { hashPassword } from "../../src/utils/password";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";

const GUIDE_EMAIL = "guide.notification@sfc.com.my";
const GUIDE_PASSWORD = "Guide123!";

async function createUser(role: UserRoles, email: string, password: string) {
  return User.create({
    username: email.split("@")[0],
    firstname: role === UserRoles.ADMIN ? "Admin" : "Park",
    lastname: "Notification",
    identification: `${email}-id`,
    personal_email: email,
    tel: "0123456789",
    role,
    password_hash: hashPassword(password),
  });
}

describe("Notification Controller Integration Tests", () => {
  it("GET /api/notifications/me - returns only the current user's active notifications", async () => {
    const guide = await createUser(UserRoles.PARK_GUIDE, GUIDE_EMAIL, GUIDE_PASSWORD);
    const other = await createUser(UserRoles.PARK_GUIDE, "other.guide@sfc.com.my", GUIDE_PASSWORD);
    await Notification.create({ user_id: guide.id, title: "Mine", message: "Read me", url: "/mine" });
    await Notification.create({ user_id: other.id, title: "Other", message: "Not mine", url: "/other" });
    const accessToken = await login({ username: GUIDE_EMAIL, password: GUIDE_PASSWORD });

    const response = await request(app)
      .get("/api/notifications/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe("Mine");
  });

  it("GET and PUT /api/notifications/preferences - reads and updates notification preferences", async () => {
    await createUser(UserRoles.PARK_GUIDE, GUIDE_EMAIL, GUIDE_PASSWORD);
    const accessToken = await login({ username: GUIDE_EMAIL, password: GUIDE_PASSWORD });

    const initialResponse = await request(app)
      .get("/api/notifications/preferences")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(initialResponse.status).toBe(200);
    expect(initialResponse.body.preferences.discussion).toBe(true);

    const updateResponse = await request(app)
      .put("/api/notifications/preferences")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ preferences: { [NotificationCategory.DISCUSSION]: false } });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.preferences.discussion).toBe(false);
  });

  it("PUT /api/notifications/:id/dismiss - dismisses the current user's notification", async () => {
    const guide = await createUser(UserRoles.PARK_GUIDE, GUIDE_EMAIL, GUIDE_PASSWORD);
    const notification = await Notification.create({
      user_id: guide.id,
      title: "Dismiss me",
      message: "This should be dismissed",
      url: "/notifications",
    });
    const accessToken = await login({ username: GUIDE_EMAIL, password: GUIDE_PASSWORD });

    const response = await request(app)
      .put(`/api/notifications/${notification.id}/dismiss`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.dismissed_at).not.toBeNull();
  });
});
