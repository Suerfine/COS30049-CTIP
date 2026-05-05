import { NextFunction, Request, Response } from "express";
import AuditLog from "../models/AuditLog";
import { sanitizeAuditLogData } from "../utils/sanitizeAuditLogData";

const HTTP_METHOD_TO_ACTION: Record<string, string> = {
  GET: "READ",
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE",
};

function normalizeIpAddress(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() || null;
  }
  return req.ip || null;
}

function normalizeResource(pathValue: string): {
  resourceType: string | null;
  resourceId: string | null;
} {
  const cleanPath = pathValue.split("?")[0] ?? "";
  const segments = cleanPath.split("/").filter(Boolean);
  if (segments.length === 0) {
    return { resourceType: null, resourceId: null };
  }

  return {
    resourceType: segments[0] ?? null,
    resourceId: segments[1] ?? null,
  };
}

function isSensitivePath(pathValue: string): boolean {
  return (
    /^\/users(\/|$)/.test(pathValue) ||
    /^\/token(\/|$)/.test(pathValue) ||
    /^\/forgot-password(\/|$)/.test(pathValue) ||
    /^\/reset-password(\/|$)/.test(pathValue)
  );
}

function buildEventType(req: Request): string {
  const action = HTTP_METHOD_TO_ACTION[req.method] || "READ";

  if (req.path === "/token" && req.method === "POST") {
    return "LOGIN_ATTEMPT";
  }
  if (req.path === "/forgot-password" && req.method === "POST") {
    return "PASSWORD_RESET_REQUEST";
  }
  if (req.path === "/reset-password" && req.method === "POST") {
    return "PASSWORD_RESET_COMPLETE";
  }

  return isSensitivePath(req.path)
    ? `SENSITIVE_DATA_${action}`
    : `DATA_${action}`;
}

function normalizeResponsePayload(value: unknown): Record<string, unknown> | null {
  const sanitized = sanitizeAuditLogData(value);
  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) {
    return null;
  }
  return sanitized as Record<string, unknown>;
}

export async function auditLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const action = HTTP_METHOD_TO_ACTION[req.method];
  if (!action || req.path.startsWith("/docs")) {
    next();
    return;
  }

  let responseBody: unknown;

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    responseBody = body;
    return originalJson(body);
  }) as Response["json"];

  const originalSend = res.send.bind(res);
  res.send = ((body: unknown) => {
    responseBody = body;
    return originalSend(body);
  }) as Response["send"];

  res.on("finish", () => {
    const { resourceType, resourceId } = normalizeResource(req.path);
    const sanitizedRequestPayload = sanitizeAuditLogData({
      params: req.params,
      query: req.query,
      body: req.body,
    });

    void AuditLog.create({
      user_id: req.user?.id ?? null,
      event_type: buildEventType(req),
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      ip_address: normalizeIpAddress(req),
      user_agent: req.get("user-agent") ?? null,
      request_data: normalizeResponsePayload(sanitizedRequestPayload),
      response_data: normalizeResponsePayload(responseBody),
    }).catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unknown audit logging error";
      console.warn("[audit] Failed to persist audit log:", message);
    });
  });

  next();
}
