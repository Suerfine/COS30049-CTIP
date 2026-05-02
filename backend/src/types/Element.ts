import { Element } from "../models";
import { ElementTypes } from "../enum/ElementTypes";

export interface ElementResponse {
  id: number;
  page_id: number;
  order: number;
  type: ElementTypes;
  content: Record<string, unknown>;
  score: number | null;
  file_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateElementRequest {
  order: number | string;
  type: string;
  content: Record<string, unknown>;
  score?: number | string | null;
}

export interface UpdateElementRequest {
  order?: number | string;
  content?: Record<string, unknown>;
  score?: number | string | null;
}

export interface BulkCreateElementRequest {
  elements: CreateElementRequest[];
}

export interface BulkUpdateElementRequest {
  elements: Array<
    {
      id: number | string;
    } & UpdateElementRequest
  >;
}

export function toElementResponse(element: Element): ElementResponse {
  return {
    id: element.id,
    page_id: element.page_id,
    order: element.order,
    type: element.type,
    content: element.content,
    score: element.score ?? null,
    file_id: element.file_id ?? null,
    created_at: element.created_at,
    updated_at: element.updated_at,
  };
}
