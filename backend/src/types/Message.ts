import { PaginateRequestParams } from "./common";

export interface MessagePaginateRequest extends PaginateRequestParams {
  discussion_id: string;
}

export interface MessageResponse {
  id: number;
  discussion_id: number;
  creator_user_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMessageRequest {
  content: string;
}

export interface UpdateMessageRequest {
  content?: string;
}
