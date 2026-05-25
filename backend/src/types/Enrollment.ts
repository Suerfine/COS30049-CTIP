import { EnrollmentStatus } from "../enum/EnrollmentStatus";
import { PaginateRequestParams } from "./common";

export interface EnrollmentResponse {
  id: number;
  user_id: number;
  course_id: number;
  status: EnrollmentStatus;
  enrolled_at: Date | null;
  completed_at: Date | null;
  reviewed_by_user_id: number | null;
  reviewed_at: Date | null;
  reviewed_comment: string | null;
  badge_expire_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEnrollmentRequest {
  course_id: number;
  status?: EnrollmentStatus;
  enrolled_at?: Date | null;
  completed_at?: Date | null;
  reviewed_by_user_id?: number | null;
  reviewed_at?: Date | null;
  reviewed_comment?: string | null;
  badge_expire_at?: Date | null;
}

export interface MyEnrollmentRequestParams extends PaginateRequestParams {
  status?: EnrollmentStatus;
}
