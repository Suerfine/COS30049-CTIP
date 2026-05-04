export function parseId(value: string): number | null {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function parseNumberField(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function parseJsonAny(value: unknown): unknown | null {
  // Accept plain objects and arrays
  if (typeof value === "object" && value !== null) {
    return value as unknown;
  }

  // If it's a string, try to parse it as JSON
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return {};
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function parseOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() === "" ? null : value;
  }

  return null;
}

export function parseBooleanField(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  return null;
}

export function parseJsonField(value: unknown): Record<string, unknown> | null {
  // If already an object, return it
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  // If it's a string, try to parse it as JSON
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return {};
    }

    try {
      const parsed = JSON.parse(trimmed);
      // Ensure it's an object, not an array or primitive
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // JSON parse failed
      return null;
    }
  }

  return null;
}
