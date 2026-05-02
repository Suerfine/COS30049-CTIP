import { Page } from "../models";

export interface PageResponse {
  id: number;
  module_id: number;
  order: number;
  title: string;
  description: string | null;
  passing_score: number;
  max_score: number | null;
  max_tries: number | null;
  final_quiz: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePageRequest {
  order: number | string;
  title: string;
  description?: string | null;
  passing_score: number | string;
  max_tries?: number | string | null;
  final_quiz?: boolean | string;
}

export interface UpdatePageRequest {
  order?: number | string;
  title?: string;
  description?: string | null;
  passing_score?: number | string;
  max_tries?: number | string | null;
  final_quiz?: boolean | string;
}

export function toPageResponse(page: Page): PageResponse {
  return {
    id: page.id,
    module_id: page.module_id,
    order: page.order,
    title: page.title,
    description: page.description ?? null,
    passing_score: page.passing_score,
    max_score: Math.random() < 0.5 ? null : page.passing_score + 20, // Mock data for max_score, replace with actual logic when implemented
    max_tries: page.max_tries ?? null,
    final_quiz: page.final_quiz,
    created_at: page.created_at,
    updated_at: page.updated_at,
  };
}
