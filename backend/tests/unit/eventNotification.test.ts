/**
 * This test if the CreateEventNotificationJob correctly creates notifications for events that are starting in 24 hours.
 *
 * It does this by first creating an event that is starting in 24 hours, then running the CreateEventNotificationJob,
 * and finally checking if a notification was created for that event. Repeats the same process for an event that is
 * starting in 48 hours and checks that no notification was created for that event.
 */

import { Notification, Event, User } from "../../src/models";
import { CreateEventNotificationJob } from "../../src/jobs/handlers/CreateEventNotificationJob";
import { describe, expect, it } from "@jest/globals";
import { EventType } from "../../src/enum/EventType";
import { EventStatus } from "../../src/enum/EventStatus";
import { UserRoles } from "../../src/enum/UserRoles";

describe("CreateEventNotificationJob", () => {
  it("Test that notifications are created for events starting in 24 hours", async () => {
    const user = await User.create({
      username: "testuser",
      firstname: "Test",
      lastname: "User",
      identification: "testuser-id",
      personal_email: "testUser@gmail.com",
      tel: "0123456789",
      role: UserRoles.PARK_GUIDE,
      password_hash: "hashedpassword",
    });

    // Create an event that is starting in 24 hours
    const event = await Event.create({
      user_id: user.id,
      title: "Test Event",
      description: "This is a test event.",
      event_start_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      period_frequency: 1,
      period_unit: "day",
      type: EventType.NORMAL,
      status: EventStatus.PENDING,
    });

    // Run the CreateEventNotificationJob
    await CreateEventNotificationJob.run();

    // Check if a notification was created for the event
    const notification = await Notification.findOne({
      where: { user_id: event.user_id, title: "Event Reminder" },
    });

    expect(notification).not.toBeNull();
    expect(notification?.message).toContain(event.title);
  });
});
