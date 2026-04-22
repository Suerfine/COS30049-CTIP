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
	created_at: Date;
	updated_at: Date;
}
