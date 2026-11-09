import { connectToDatabase } from "@/lib/db";
import PlatformAuditEvent from "@/models/PlatformAuditEvent";

const SECRET_KEY_PATTERN =
  /(password|secret|token|authorization|cookie|api.?key|private.?key|credential)/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[depth-limited]";
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redact(item, depth + 1));
  if (!value || typeof value !== "object") {
    if (typeof value === "string") return value.slice(0, 2000);
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>).slice(0, 80)) {
    result[key] = SECRET_KEY_PATTERN.test(key) ? "[redacted]" : redact(child, depth + 1);
  }
  return result;
}

export interface WritePlatformAuditEventInput {
  actorType: "human" | "ai" | "system";
  actorId: string;
  actorLabel?: string;
  action: string;
  module: string;
  targetType?: string;
  targetId?: string;
  outcome: "success" | "denied" | "failure";
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function writePlatformAuditEvent(input: WritePlatformAuditEventInput) {
  await connectToDatabase();
  return PlatformAuditEvent.create({
    ...input,
    metadata: redact(input.metadata || {}),
  });
}
