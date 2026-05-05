import { SENSITIVE_LOG_KEYWORDS } from "../config/SensitiveFields";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function shouldSanitize(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  return SENSITIVE_LOG_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function maskEmail(value: string): string {
  const [localPart, domain] = value.split("@");
  if (!localPart || !domain) {
    return "***REDACTED***";
  }

  const visible = localPart.slice(0, 2);
  return `${visible}***@${domain}`;
}

function maskPhone(value: string): string {
  const tail = value.slice(-4);
  return `***${tail}`;
}

function sanitizePrimitive(key: string, value: unknown): unknown {
  if (!shouldSanitize(key)) {
    return value;
  }

  if (typeof value !== "string") {
    return "***REDACTED***";
  }

  const normalizedKey = key.toLowerCase();
  if (normalizedKey.includes("email")) {
    return maskEmail(value);
  }
  if (normalizedKey.includes("tel") || normalizedKey.includes("phone")) {
    return maskPhone(value);
  }

  return "***REDACTED***";
}

export function sanitizeAuditLogData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditLogData(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, childValue] of Object.entries(value)) {
    if (Array.isArray(childValue) || isPlainObject(childValue)) {
      result[key] = sanitizeAuditLogData(childValue);
      continue;
    }
    result[key] = sanitizePrimitive(key, childValue);
  }

  return result;
}
