/**
 * Shared analytics definitions. Both founder analytics views use these exact
 * traffic and time-window rules so their headline metrics reconcile.
 */
export const ANALYTICS_BOT_USER_AGENT_PATTERN =
  "HeadlessChrome|PhantomJS|Playwright|Puppeteer|bot|crawler|spider|slurp|facebookexternalhit|TelegramBot|Twitterbot|LinkedInBot|Discordbot|Google-InspectionTool";

export const TRUSTED_ANALYTICS_TRAFFIC_FILTER: Record<string, unknown> = {
  isInternal: { $ne: true },
  $nor: [
    { userAgent: { $regex: ANALYTICS_BOT_USER_AGENT_PATTERN, $options: "i" } },
    { referrer: { $regex: "tgo-devstudio-prime-[a-z0-9]+-testimonygboroye\\.vercel\\.app", $options: "i" } },
    { host: { $regex: "^tgo-devstudio-prime-[a-z0-9]+-testimonygboroye\\.vercel\\.app$", $options: "i" } },
  ],
};

export const DEFAULT_ANALYTICS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const ONLINE_VISITOR_WINDOW_MS = 2 * 60 * 1000;

export function getDefaultAnalyticsRange(now = new Date()) {
  return {
    start: new Date(now.getTime() - DEFAULT_ANALYTICS_WINDOW_MS),
    end: now,
  };
}

export function getUtcDayRange(from?: string | null, to?: string | null, now = new Date()) {
  const defaults = getDefaultAnalyticsRange(now);
  const start = from ? new Date(`${from}T00:00:00.000Z`) : defaults.start;
  const end = to
    ? new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000)
    : defaults.end;
  return {
    $gte: Number.isNaN(start.getTime()) ? defaults.start : start,
    $lt: Number.isNaN(end.getTime()) ? defaults.end : end,
  };
}

export function onlineCutoff(now = new Date()) {
  return new Date(now.getTime() - ONLINE_VISITOR_WINDOW_MS);
}

