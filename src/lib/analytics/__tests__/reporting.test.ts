import {
  getDefaultAnalyticsRange,
  getUtcDayRange,
  onlineCutoff,
  ONLINE_VISITOR_WINDOW_MS,
} from "../reporting";

describe("shared analytics reporting rules", () => {
  it("uses the same rolling 30-day default window", () => {
    const now = new Date("2026-11-25T12:00:00.000Z");
    const range = getDefaultAnalyticsRange(now);
    expect(range.start.toISOString()).toBe("2026-10-26T12:00:00.000Z");
    expect(range.end.toISOString()).toBe(now.toISOString());
  });

  it("uses UTC calendar days with an exclusive end boundary", () => {
    const range = getUtcDayRange("2026-10-26", "2026-11-24", new Date("2026-11-25T12:00:00.000Z"));
    expect(range.$gte.toISOString()).toBe("2026-10-26T00:00:00.000Z");
    expect(range.$lt.toISOString()).toBe("2026-11-25T00:00:00.000Z");
  });

  it("defines online presence using the shared two-minute heartbeat window", () => {
    const now = new Date("2026-11-25T12:00:00.000Z");
    expect(onlineCutoff(now).getTime()).toBe(now.getTime() - ONLINE_VISITOR_WINDOW_MS);
  });
});
