import { RegistrationStatus } from "../enum/RegistrationStatus";
import { UserResponse } from "./User";

export interface RegistrationResponse {
  id: number;
  user_id: number | null;
  reviewed_by_user_id: number | null;
  status: RegistrationStatus;
  firstname: string;
  lastname: string;
  identification: string;
  personal_email: string;
  tel: string;
  document_filepath: string | null;
  admin_remark: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRegistrationRequest {
  user_id?: number | null;
  reviewed_by_user_id?: number | null;
  status?: RegistrationStatus;
  firstname: string;
  lastname: string;
  identification: string;
  personal_email: string;
  tel: string;
  admin_remark?: string | null;
  reviewed_at?: string | Date | null;
}

export interface UpdateRegistrationRequest {
  user_id?: number | null;
  reviewed_by_user_id?: number | null;
  status?: RegistrationStatus;
  firstname?: string;
  lastname?: string;
  identification?: string;
  personal_email?: string;
  tel?: string;
  admin_remark?: string | null;
  reviewed_at?: string | Date | null;
}

export interface ApproveRegistrationRequest {}

export interface RejectRegistrationRequest {
  message: string;
}

export interface ApproveRegistrationResponse {
  registration: RegistrationResponse;
  user: UserResponse;
  email_sent: boolean;
  email_error?: string;
  manual_credentials?: {
    account_email: string;
    temporary_password: string;
  };
}
