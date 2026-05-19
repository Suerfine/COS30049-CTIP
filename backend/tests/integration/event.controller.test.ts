import request from "supertest";
import app from "../../src/server";
import { Event, User } from "../../src/models";
import { EventStatus } from "../../src/enum/EventStatus";
import { EventType } from "../../src/enum/EventType";
import { UserRoles } from "../../src/enum/UserRoles";
import { hashPassword } from "../../src/utils/password";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";

const USER_EMAIL = "event.user@sfc.com.my";
const USER_PASSWORD = "User123!";

async function createParkGuide() {
  return User.create({
    username: "event-user",
    firstname: "Event",
    lastname: "User",
    identification: "event-user-id",
    personal_email: USER_EMAIL,
    tel: "0123456789",
    role: UserRoles.PARK_GUIDE,
    password_hash: hashPassword(USER_PASSWORD),
  });
}

describe("Event Controller Integration Tests", () => {
  it("POST /api/events - creates a todo event for the logged-in user", async () => {
    const user = await createParkGuide();
    const accessToken = await login({ username: USER_EMAIL, password: USER_PASSWORD });

    const response = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Prepare workshop",
        description: "Review training materials",
        event_start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: "normal",
      });

    expect(response.status).toBe(201);
    expect(response.body.user_id).toBe(user.id);
    expect(response.body.status).toBe(EventStatus.PENDING);
  });

  it("GET /api/events - returns only the current user's events", async () => {
    const user = await createParkGuide();
    const other = await User.create({
      username: "other-event-user",
      firstname: "Other",
      lastname: "User",
      identification: "other-event-user-id",
      personal_email: "other.event@sfc.com.my",
      tel: "0123456789",
      role: UserRoles.PARK_GUIDE,
      password_hash: hashPassword(USER_PASSWORD),
    });
    await Event.create({
      user_id: user.id,
      title: "Mine",
      description: "My todo",
      event_start_at: new Date(),
      type: EventType.NORMAL,
      status: EventStatus.PENDING,
      period_frequency: 0,
      period_unit: "day",
    });
    await Event.create({
      user_id: other.id,
      title: "Other",
      description: "Other todo",
      event_start_at: new Date(),
      type: EventType.NORMAL,
      status: EventStatus.PENDING,
      period_frequency: 0,
      period_unit: "day",
    });
    const accessToken = await login({ username: USER_EMAIL, password: USER_PASSWORD });

    const response = await request(app)
      .get("/api/events")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe("Mine");
  });

  it("GET, PUT, PATCH and DELETE /api/events/:id - manages a todo event", async () => {
    const user = await createParkGuide();
    const event = await Event.create({
      user_id: user.id,
      title: "Original todo",
      description: "Original details",
      event_start_at: new Date(),
      type: EventType.NORMAL,
      status: EventStatus.PENDING,
      period_frequency: 0,
      period_unit: "day",
    });
    const accessToken = await login({ username: USER_EMAIL, password: USER_PASSWORD });

    const getResponse = await request(app)
      .get(`/api/events/${event.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.title).toBe("Original todo");

    const updateResponse = await request(app)
      .put(`/api/events/${event.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated todo", description: "Updated details" });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe("Updated todo");

    const statusResponse = await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBe(EventStatus.COMPLETED);

    const deleteResponse = await request(app)
      .delete(`/api/events/${event.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(deleteResponse.status).toBe(200);
    expect(await Event.findByPk(event.id)).toBeNull();
  });
});
