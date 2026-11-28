import type { Types } from "mongoose";

type SlaMessage = { senderType?: string; createdAt?: Date | string };
type SlaTicket = {
  slaPausedAt?: Date;
  slaPausedDurationMs?: number;
  resolutionDueAt: Date;
  messages?: SlaMessage[];
};

/**
 * Resolution time is paused while the next action belongs to the client.
 * First-response time is never paused: it ends only when staff/AI first responds.
 */
export function pauseSupportResolutionClock(ticket: SlaTicket, now = new Date()) {
  if (!ticket.slaPausedAt) ticket.slaPausedAt = now;
}

/**
 * Resume the resolution clock and move its deadline by the exact client-wait
 * duration. For legacy tickets without slaPausedAt, infer the pause start from
 * the most recent staff/AI response rather than charging the client-wait time.
 */
export function resumeSupportResolutionClock(ticket: SlaTicket, now = new Date()) {
  const inferredPause = [...(ticket.messages || [])]
    .reverse()
    .find((message) => message.senderType === "staff" || message.senderType === "ai")?.createdAt;
  const pauseStart = ticket.slaPausedAt || (inferredPause ? (inferredPause instanceof Date ? inferredPause : new Date(inferredPause)) : undefined);

  if (pauseStart && Number.isFinite(pauseStart.getTime())) {
    const pausedFor = Math.max(0, now.getTime() - pauseStart.getTime());
    ticket.resolutionDueAt = new Date(ticket.resolutionDueAt.getTime() + pausedFor);
    ticket.slaPausedDurationMs = Math.max(0, ticket.slaPausedDurationMs || 0) + pausedFor;
  }

  delete ticket.slaPausedAt;
}

export function isSupportTicketSlaActive(status: string) {
  return status === "open" || status === "in_progress" || status === "waiting_on_team";
}
