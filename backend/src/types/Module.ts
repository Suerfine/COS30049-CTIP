import { Module } from "../models";

export interface ModuleResponse {
  id: number;
  course_id: number;
  order: number;
  title: string;
  description: string | null;
  complete_by_week: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateModuleRequest {
  order: number | string;
  title: string;
  description?: string | null;
  complete_by_week: number | string;
}

export interface UpdateModuleRequest {
  order?: number | string;
  title?: string;
  description?: string | null;
  complete_by_week?: number | string;
}

export function toModuleResponse(module: Module): ModuleResponse {
  return {
    id: module.id,
    course_id: module.course_id,
    order: module.order,
    title: module.title,
    description: module.description ?? null,
    complete_by_week: module.complete_by_week,
    created_at: module.created_at,
    updated_at: module.updated_at,
  };
}
