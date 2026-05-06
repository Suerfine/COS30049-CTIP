export interface ArModelResponse {
  id: number;
  title: string;
  description: string | null;
  model_format: string;
  model_size_bytes: number;
  original_filename: string;
  mime_type: string;
  model_url: string;
  pattern_url: string | null;
  ar_viewer_url: string;
  created_by_user_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateArModelRequest {
  title: string;
  description?: string | null;
}
