import { UserRoles } from "../enum/UserRoles";
import { PaginateRequestParams } from "./common";

export interface GetAllUserRequest extends PaginateRequestParams {}

export interface GetUserByIdRequest {
	id: string;
}

export interface UserResponse {
	id: number;
	username: string;
	role: UserRoles;
    last_login_at: Date | null;
	created_at: Date;
	updated_at: Date;
}

export interface CreateUserRequest {
    username: string;
    password: string;
    role: UserRoles;
    registration_id?: number;
    // For admin users since they dont have a registration, we will need to
    // require either an email and their identification number
    identification?: string;
    personal_email?: string;
}

export interface UpdateUserRequest {
    username?: string;
    password?: string;
    role?: UserRoles;
    identification?: string;
    personal_email?: string;
}
