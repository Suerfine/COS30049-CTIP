import { Notification, User } from "../models";
import { UserRoles } from "../enum/UserRoles";
import { Transaction } from "sequelize";
import { NotificationCategory } from "../enum/NotificationCategory";
import { getUsersWithNotificationEnabled } from "./notificationPreferences";

export async function sendNotification(
  mode: "all" | "admin" | "single",
  title: string,
  message: string,
  transaction: Transaction,
  userId?: number,
  sendEmail: boolean = false,
  category?: NotificationCategory,
  url?: string | null,
): Promise<void> {
  try {
    let targetUserIds: number[] = [];

    switch (mode) {
      case "all":
        targetUserIds = await User.findAll({ attributes: ["id"] }).then(
          (users) => users.map((user) => user.id),
        );
        break;
      case "admin":
        targetUserIds = await User.findAll({
          where: { role: UserRoles.ADMIN },
          attributes: ["id"],
        }).then((admins) => admins.map((admin) => admin.id));
        break;
      case "single":
        if (!userId) {
          throw new Error("User ID is required for 'single' mode");
        }
        targetUserIds = [userId];
        break;
    }

    const enabledUserIds = await getUsersWithNotificationEnabled(
      targetUserIds,
      category,
    );

    await Promise.all(
      enabledUserIds.map((targetUserId) =>
        Notification.create(
          {
            user_id: targetUserId,
            title,
            message,
            url: url || null,
          },
          { transaction },
        ),
      ),
    );
    // TODO: If sendEmail is true, implement logic to send an email notification to the user
  } catch (error) {
    throw error;
  }
}
