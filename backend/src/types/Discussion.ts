import { PaginateRequestParams } from "./common";

export interface DiscussionPaginateRequest extends PaginateRequestParams {
  course_id: string;
}

export interface DiscussionResponse {
  id: number;
  course_id: number;
  creator_user_id: number;
  title: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDiscussionRequest {
  title: string;
  is_public?: boolean;
}

export interface UpdateDiscussionRequest {
  title?: string;
  is_public?: boolean;
}
