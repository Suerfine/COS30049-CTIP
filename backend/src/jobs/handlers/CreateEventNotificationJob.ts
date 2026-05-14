import { Op } from "sequelize";
import { CronJobDefinition } from "../types";
import { Event, Notification } from "../../models";

export const CreateEventNotificationJob: CronJobDefinition = {
  name: "create-event-notification",
  category: "daily",
  schedule: "0 8 * * *",

  async run() {
    console.log("Creating event notifications...");

    // Retrieve all events that are starting in the next 24 hours
    const events = await Event.findAll({
      where: {
        event_start_at: {
          [Op.between]: [
            new Date(),
            new Date(Date.now() + 24 * 60 * 60 * 1000),
          ],
        },
      },
    });

    //For each event, create a notification for the user
    for (const event of events) {
      await Notification.create({
        user_id: event.user_id,
        title: "Event Reminder",
        message: `Reminder: Your event "${event.title}" is happening ${event.event_start_at.toLocaleString()}`,
      });
    }

    console.log(`Created ${events.length} notifications for upcoming events.`);
  },
};
