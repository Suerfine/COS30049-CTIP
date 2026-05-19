import request from "supertest";
import app from "../../src/server";
import { AnomalyEvent, Notification, User } from "../../src/models";
import { UserRoles } from "../../src/enum/UserRoles";
import { hashPassword } from "../../src/utils/password";
import { login } from "../helper/auth";
import { describe, expect, it } from "@jest/globals";

const ADMIN_EMAIL = "admin.anomaly@sfc.com.my";
const ADMIN_PASSWORD = "Admin123!";
const GUIDE_EMAIL = "guide.anomaly@sfc.com.my";
const GUIDE_PASSWORD = "Guide123!";

async function createUser(role: UserRoles, email: string, password: string) {
  return User.create({
    username: email.split("@")[0],
    firstname: role === UserRoles.ADMIN ? "Admin" : "Park",
    lastname: "Anomaly",
    identification: `${email}-id`,
    personal_email: email,
    tel: "0123456789",
    role,
    password_hash: hashPassword(password),
  });
}

describe("Anomaly Event Controller Integration Tests", () => {
  it("POST /api/anomaly-events - creates an anomaly event and sends notifications", async () => {
    const admin = await createUser(UserRoles.ADMIN, ADMIN_EMAIL, ADMIN_PASSWORD);
    const guide = await createUser(UserRoles.PARK_GUIDE, GUIDE_EMAIL, GUIDE_PASSWORD);
    const accessToken = await login({ username: GUIDE_EMAIL, password: GUIDE_PASSWORD });

    const response = await request(app)
      .post("/api/anomaly-events")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        user_id: guide.id,
        event_type: "touching_plant",
        metadata: { confidence: 0.93 },
        latitude: 1.5533,
        longitude: 110.3592,
      });

    expect(response.status).toBe(201);
    expect(response.body.event_type).toBe("touching_plant");
    expect(await Notification.findOne({ where: { user_id: admin.id, url: "/anomaly-events" } })).not.toBeNull();
    expect(await Notification.findOne({ where: { user_id: guide.id, url: "/anomaly" } })).not.toBeNull();
  });

  it("GET anomaly routes - lists all, map, user events, and user stats", async () => {
    const guide = await createUser(UserRoles.PARK_GUIDE, GUIDE_EMAIL, GUIDE_PASSWORD);
    await AnomalyEvent.create({
      user_id: guide.id,
      event_type: "touching_animal",
      metadata: { source: "test" },
      latitude: 1.5533,
      longitude: 110.3592,
    });

    const listResponse = await request(app).get("/api/anomaly-events");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const mapResponse = await request(app).get("/api/anomaly-events/map");
    expect(mapResponse.status).toBe(200);
    expect(mapResponse.body).toHaveLength(1);

    const userResponse = await request(app).get(`/api/anomaly-events/${guide.id}`);
    expect(userResponse.status).toBe(200);
    expect(userResponse.body.data).toHaveLength(1);

    const statsResponse = await request(app).get(`/api/anomaly-events/stats/${guide.id}`);
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.total_events).toBe(1);
  });

  it("PATCH /api/anomaly-events/:eventId/resolve - marks an anomaly as resolved", async () => {
    const guide = await createUser(UserRoles.PARK_GUIDE, GUIDE_EMAIL, GUIDE_PASSWORD);
    const event = await AnomalyEvent.create({
      user_id: guide.id,
      event_type: "touching_plant",
      latitude: 1.5533,
      longitude: 110.3592,
    });
    const accessToken = await login({ username: GUIDE_EMAIL, password: GUIDE_PASSWORD });

    const response = await request(app)
      .patch(`/api/anomaly-events/${event.id}/resolve`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.is_resolved).toBe(true);
  });
});
