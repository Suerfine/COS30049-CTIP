import { CourseStatus } from "../enum/CourseStatus";

export interface PrerequisiteResponse {
  id: number;
  course_id: number;
  prerequisite_group_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface PrerequisiteGroupResponse {
  id: number;
  course_id: number;
  created_at: Date;
  updated_at: Date;
  prerequisites: PrerequisiteResponse[];
}

export interface CourseTagResponse {
  id: number;
  title: string;
  type: string;
}

export interface CourseResponse {
  id: number;
  title: string;
  description: string | null;
  status: CourseStatus;
  released_at: Date | null;
  expected_completion_weeks: number | null;
  must_complete_in_weeks: number | null;
  badge_expire_in_months: number;
  badge_img_url: string | null;
  cover_img_url: string | null;
  tags: CourseTagResponse[];
  final_quiz_max_score: number | null;
  total_max_score: number | null;
  prerequisite_groups: PrerequisiteGroupResponse[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateCourseRequest {
  title: string;
  description?: string | null;
  status?: CourseStatus;
  released_at?: string | Date | null;
  expected_completion_weeks?: number;
  must_complete_in_weeks?: number;
  badge_expire_in_months?: number;
  tag_ids?: number[];
  prerequisite_course_ids?: number[][];
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string | null;
  status?: CourseStatus;
  released_at?: string | Date | null;
  expected_completion_weeks?: number | null;
  must_complete_in_weeks?: number | null;
  badge_expire_in_months?: number;
  tag_ids?: number[];
  prerequisite_course_ids?: number[][];
}
