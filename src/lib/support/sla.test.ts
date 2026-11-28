import { pauseSupportResolutionClock, resumeSupportResolutionClock, isSupportTicketSlaActive } from "./sla";

describe("support resolution SLA clock", () => {
  it("pauses once while waiting for the client", () => {
    const now = new Date("2026-11-28T10:00:00.000Z");
    const ticket: { resolutionDueAt: Date; slaPausedAt?: Date } = { resolutionDueAt: new Date("2026-11-29T10:00:00.000Z") };
    pauseSupportResolutionClock(ticket, now);
    pauseSupportResolutionClock(ticket, new Date("2026-11-28T11:00:00.000Z"));
    expect(ticket.slaPausedAt).toEqual(now);
  });

  it("extends the resolution deadline by the exact paused duration", () => {
    const ticket = {
      slaPausedAt: new Date("2026-11-28T10:00:00.000Z"),
      resolutionDueAt: new Date("2026-11-29T10:00:00.000Z"),
      slaPausedDurationMs: 0,
    };
    resumeSupportResolutionClock(ticket, new Date("2026-11-28T16:30:00.000Z"));
    expect(ticket.resolutionDueAt).toEqual(new Date("2026-11-29T16:30:00.000Z"));
    expect(ticket.slaPausedDurationMs).toBe(6.5 * 60 * 60 * 1000);
    expect(ticket.slaPausedAt).toBeUndefined();
  });

  it("recovers legacy waiting periods from the last staff reply", () => {
    const ticket = {
      resolutionDueAt: new Date("2026-11-29T10:00:00.000Z"),
      messages: [{ senderType: "staff", createdAt: new Date("2026-11-28T10:00:00.000Z") }],
    };
    resumeSupportResolutionClock(ticket, new Date("2026-11-28T12:00:00.000Z"));
    expect(ticket.resolutionDueAt).toEqual(new Date("2026-11-29T12:00:00.000Z"));
  });

  it("only considers team-owned workflow states SLA-active", () => {
    expect(isSupportTicketSlaActive("open")).toBe(true);
    expect(isSupportTicketSlaActive("waiting_on_team")).toBe(true);
    expect(isSupportTicketSlaActive("waiting_on_client")).toBe(false);
    expect(isSupportTicketSlaActive("resolved")).toBe(false);
  });
});
