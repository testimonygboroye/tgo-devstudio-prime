const SECRET_KEY_PATTERN =
  /(password|secret|token|authorization|cookie|api.?key|private.?key|credential)/i;

export function sanitizePlatformMetadata(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[depth-limited]";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizePlatformMetadata(item, depth + 1));
  }
  if (!value || typeof value !== "object") {
    if (typeof value === "string") return value.slice(0, 2000);
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>).slice(0, 80)) {
    result[key] = SECRET_KEY_PATTERN.test(key)
      ? "[redacted]"
      : sanitizePlatformMetadata(child, depth + 1);
  }
  return result;
}

export const sanitizeAuditMetadata = sanitizePlatformMetadata;
