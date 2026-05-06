export interface SubmissionResponse {
  id: number;
  enrollment_id: number;
  element_id: number;
  submission_id: number | null;
  marked_by_user_id: number | null;
  content: Record<string, unknown>;
  marking_remark: string | null;
  earned_grade: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSubmissionRequest {
  enrollment_id?: unknown;
  element_id?: unknown;
  submission_id?: unknown;
  content?: unknown;
  earned_grade?: number;
}

export interface UpdateSubmissionRequest {
  content?: unknown;
  marking_remark?: unknown;
  earned_grade?: unknown;
}

export interface MarkSubmissionRequest {
  earned_grade?: number;
  marking_remark?: string;
}
