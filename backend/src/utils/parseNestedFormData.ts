/**
 * Converts flat form-data keys with bracket notation (e.g., elements[0][order])
 * into nested array/object structures.
 *
 * Example:
 * Input:  { "elements[0][order]": "1", "elements[0][type]": "text" }
 * Output: { elements: [{ order: "1", type: "text" }] }
 */
export function parseNestedFormData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Match patterns like "elements[0][order]" or "elements[0]"
    const match = key.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)(\[.*\])$/);

    if (!match) {
      // No bracket notation, just assign directly
      result[key] = value;
      continue;
    }

    const rootName = match[1];
    const bracketPart = match[2];

    // Initialize root if not exists
    if (!result[rootName]) {
      // Determine if this should be an array or object
      const firstBracketMatch = bracketPart.match(/^\[(\d+)\]/);
      result[rootName] = firstBracketMatch ? [] : {};
    }

    // Parse the bracket notation recursively
    const obj = result[rootName];
    parseAndSetNestedValue(obj, bracketPart, value);
  }

  return result;
}

function parseAndSetNestedValue(
  obj: any,
  bracketNotation: string,
  value: unknown,
): void {
  // Match [0], [property], [0][property], etc.
  const matches = bracketNotation.match(/\[([^\]]+)\]/g);
  if (!matches) return;

  let current = obj;
  for (let i = 0; i < matches.length - 1; i++) {
    const key = matches[i].slice(1, -1); // Remove [ and ]
    const nextKey = matches[i + 1].slice(1, -1);

    // Determine if the next level should be array or object
    const isNextArray = /^\d+$/.test(nextKey);

    if (!current[key]) {
      current[key] = isNextArray ? [] : {};
    }
    current = current[key];
  }

  // Set the final value
  const lastKey = matches[matches.length - 1].slice(1, -1);
  current[lastKey] = value;
}
