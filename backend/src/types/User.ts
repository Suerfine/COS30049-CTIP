import { UserRoles } from "../enum/UserRoles";
import { PaginateRequestParams } from "./common";
import { User } from "../models";
import { getStorage } from "../services/storage";

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
  pfp_url: string | null;
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

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.role,
    identification: user.identification,
    personal_email: user.personal_email,
    tel: user.tel,
    pfp_url: user.pfp_url,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}
