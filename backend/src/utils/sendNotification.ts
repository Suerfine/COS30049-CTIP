import { th } from "@faker-js/faker";
import sequelize from "../config/Database";
import { Notification, User } from "../models";
import { UserRoles } from "../enum/UserRoles";
import { Transaction } from "sequelize";

export async function sendNotification(
  mode: "all" | "admin" | "single",
  title: string,
  message: string,
  transaction: Transaction,
  userId?: number,
  sendEmail: boolean = false,
): Promise<void> {
  try {
    switch (mode) {
      case "all":
        User.findAll().then((users) => {
          users.forEach((user) => {
            Notification.create({
              user_id: user.id,
              title,
              message,
            });
          });
        });
        break;
      case "admin":
        User.findAll({
          where: { role: UserRoles.ADMIN },
        }).then((admins) => {
          admins.forEach((admin) => {
            Notification.create({
              user_id: admin.id,
              title,
              message,
            });
          });
        });
        break;
      case "single":
        if (!userId) {
          throw new Error("User ID is required for 'single' mode");
        }
        Notification.create({
          user_id: userId,
          title,
          message,
        });
        break;
      case "single":
        if (!userId) {
          throw new Error("User ID is required for 'single' mode");
        }
        Notification.create({
          user_id: userId,
          title,
          message,
        });
        break;
    }
    // TODO: If sendEmail is true, implement logic to send an email notification to the user
  } catch (error) {
    throw error;
  }
}
