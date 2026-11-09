import { connectToDatabase } from "@/lib/db";
import PlatformAuditEvent from "@/models/PlatformAuditEvent";
import { sanitizeAuditMetadata } from "@/platform/audit/sanitize";

export { sanitizeAuditMetadata } from "@/platform/audit/sanitize";

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
    metadata: sanitizeAuditMetadata(input.metadata || {}) as Record<string, unknown>,
  });
}
