export enum NotificationCategory {
  DISCUSSION = "discussion",
  TODO_REMINDER = "todo_reminder",
  ANOMALY_ALERT = "anomaly_alert",
  REGISTRATION_REVIEW = "registration_review",
  PAYMENT_APPROVAL = "payment_approval",
  ENROLLMENT_SUCCESS = "enrollment_success",
  BADGE_AWARDED = "badge_awarded",
  COURSE_EXPIRY = "course_expiry",
  PAYMENT_REJECTED = "payment_rejected",
}

export const NOTIFICATION_CATEGORY_VALUES = Object.values(NotificationCategory);
