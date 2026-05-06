import { faker } from "@faker-js/faker";

export type NotificationFactoryAttributes = {
  id?: number;
  user_id: number;
  title: string;
  message: string;
  url: string | null;
  dismissed_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type NotificationFactoryInput = Partial<NotificationFactoryAttributes>;

const getRandomNotificationUrl = (): string | null => {
  return faker.helpers.arrayElement([
    null,
    `/courses/${faker.number.int({ min: 1, max: 20 })}`,
    `/discussions/${faker.number.int({ min: 1, max: 20 })}`,
    `/profile`,
    `/notifications`,
  ]);
};

const getNotificationTitle = (): string => {
  return faker.helpers.arrayElement([
    "Course update available",
    "New message received",
    "Action required",
    "Reminder: upcoming deadline",
    "System maintenance notice",
    "New registration request",
    "Your submission has been reviewed",
    "Security alert",
  ]);
};

const getNotificationMessage = (): string => {
  return faker.helpers.arrayElement([
    "A new course module has been published and is ready for review.",
    "You have received a message from an administrator. Please check your inbox.",
    "An important update is available for one of your assigned courses.",
    "Please complete your pending registration before the deadline.",
    "A recent submission requires your attention and review.",
    "Maintenance is scheduled tonight; some features may be temporarily unavailable.",
    "Your account settings were updated successfully.",
    "Reminder: please verify your profile information to keep your access active.",
  ]);
};

export const buildNotification = (
  userId: number,
  overrides: NotificationFactoryInput = {},
): NotificationFactoryAttributes => {
  const defaultCreatedAt = overrides.created_at ?? faker.date.recent({ days: 30 });
  const defaultUpdatedAt = overrides.updated_at ?? faker.date.between({
    from: defaultCreatedAt,
    to: new Date(),
  });

  const resolvedDismissedAt = Object.prototype.hasOwnProperty.call(
    overrides,
    "dismissed_at",
  )
    ? overrides.dismissed_at ?? null
    : faker.helpers.arrayElement([
        null,
        faker.date.between({ from: defaultCreatedAt, to: new Date() }),
      ]);

  const defaultNotification: NotificationFactoryAttributes = {
    user_id: userId,
    title: getNotificationTitle(),
    message: getNotificationMessage(),
    url: getRandomNotificationUrl(),
    dismissed_at: resolvedDismissedAt,
    created_at: defaultCreatedAt,
    updated_at: defaultUpdatedAt,
  };

  return {
    ...defaultNotification,
    ...overrides,
    user_id: userId,
  };
};

export const buildNotifications = (
  count: number,
  userId: number,
  overrides: NotificationFactoryInput = {},
): NotificationFactoryAttributes[] => {
  const notifications: NotificationFactoryAttributes[] = [];

  for (let i = 0; i < count; i++) {
    notifications.push(buildNotification(userId, overrides));
  }

  return notifications;
};

export default {
  buildNotification,
  buildNotifications,
};
