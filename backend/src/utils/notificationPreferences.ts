import { Op, Transaction } from "sequelize";
import NotificationPreference from "../models/NotificationPreference";
import {
  NotificationCategory,
  NOTIFICATION_CATEGORY_VALUES,
} from "../enum/NotificationCategory";

export type NotificationPreferenceMap = Record<NotificationCategory, boolean>;

export const getDefaultNotificationPreferences = (): NotificationPreferenceMap =>
  NOTIFICATION_CATEGORY_VALUES.reduce((preferences, category) => {
    preferences[category] = true;
    return preferences;
  }, {} as NotificationPreferenceMap);

export async function getNotificationPreferences(
  userId: number,
  transaction?: Transaction,
): Promise<NotificationPreferenceMap> {
  const preferences = getDefaultNotificationPreferences();
  const savedPreferences = await NotificationPreference.findAll({
    where: { user_id: userId },
    transaction,
  });

  savedPreferences.forEach((preference) => {
    preferences[preference.category] = preference.enabled;
  });

  return preferences;
}

export async function isNotificationEnabled(
  userId: number,
  category?: NotificationCategory,
): Promise<boolean> {
  if (!category) {
    return true;
  }

  const preference = await NotificationPreference.findOne({
    where: { user_id: userId, category },
  });

  return preference?.enabled ?? true;
}

export async function updateNotificationPreferences(
  userId: number,
  preferences: Partial<Record<NotificationCategory, boolean>>,
  transaction?: Transaction,
): Promise<NotificationPreferenceMap> {
  const validCategories = new Set(NOTIFICATION_CATEGORY_VALUES);
  const entries = Object.entries(preferences).filter(
    ([category, enabled]) =>
      validCategories.has(category as NotificationCategory) &&
      typeof enabled === "boolean",
  ) as [NotificationCategory, boolean][];

  for (const [category, enabled] of entries) {
    const existingPreference = await NotificationPreference.findOne({
      where: { user_id: userId, category },
      transaction,
    });

    if (existingPreference) {
      await existingPreference.update({ enabled }, { transaction });
    } else {
      await NotificationPreference.create(
        { user_id: userId, category, enabled },
        { transaction },
      );
    }
  }

  return getNotificationPreferences(userId, transaction);
}

export async function getUsersWithNotificationEnabled(
  userIds: number[],
  category?: NotificationCategory,
): Promise<number[]> {
  if (!category || userIds.length === 0) {
    return userIds;
  }

  const disabledPreferences = await NotificationPreference.findAll({
    where: {
      user_id: { [Op.in]: userIds },
      category,
      enabled: false,
    },
    attributes: ["user_id"],
  });
  const disabledUserIds = new Set(
    disabledPreferences.map((preference) => preference.user_id),
  );

  return userIds.filter((userId) => !disabledUserIds.has(userId));
}
