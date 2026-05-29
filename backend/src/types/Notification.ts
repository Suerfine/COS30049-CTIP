import { PaginateRequestParams } from "./common";
import { NotificationCategory } from "../enum/NotificationCategory";

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  url: string | null;
  dismissed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNotificationRequest {
  for_all_park_guides?: boolean; // If true, the notification will be sent to all ParkGuides. If false or not provided, target_user_ids must be provided.
  target_user_ids: number[];
  title: string;
  message: string;
  url?: string | null;
  category?: NotificationCategory;
}

export interface UpdateNotificationRequest {
  title: string;
  message: string;
  url: string | null;
  dismissed_at: Date | null;
}

export interface UpdateNotificationPreferencesRequest {
  preferences: Partial<Record<NotificationCategory, boolean>>;
}
