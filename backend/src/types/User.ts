import { UserRoles } from "../enum/UserRoles";
import { PaginateRequestParams } from "./common";

export interface GetAllUserRequest extends PaginateRequestParams {}

export interface GetUserByIdRequest {
  id: string;
}

export interface UserResponse {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  role: UserRoles;
  identification: string;
  personal_email: string;
  tel: string;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRoles;
  firstname: string;
  lastname: string;
  identification: string;
  personal_email: string;
  tel: string;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: UserRoles;
  firstname?: string;
  lastname?: string;
  identification?: string;
  personal_email?: string;
  tel?: string;
}
