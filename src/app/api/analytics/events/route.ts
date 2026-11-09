import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { requireContentPermission, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";
import AnalyticsEvent, { type AnalyticsEventName } from "@/models/AnalyticsEvent";
import { parseUserAgent } from "@/lib/analytics/visitor";
import PageView from "@/models/PageView";
import Visitor from "@/models/Visitor";

export const dynamic = "force-dynamic";

const ALLOWED_EVENTS: AnalyticsEventName[] = [
  "whatsapp_click", "email_click", "book_call_click", "calendly_event_scheduled",
  "contact_cta_click", "portfolio_click", "service_click", "newsletter_signup_click", "cta_click", "web_vital",
];
const ID_PATTERN = /^[a-zA-Z0-9-]{12,80}$/;

function safePath(value: unknown): string {
  if (typeof value !== "string") return "/";
  const path = value.split("?")[0].split("#")[0].slice(0, 500);
  return path.startsWith("/") ? path : "/";
}

function safeTarget(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value);
    return (url.origin + url.pathname).slice(0, 500);
  } catch {
    return value.startsWith("/") ? value.split("?")[0].slice(0, 500) : undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventName = body?.eventName as AnalyticsEventName;
    if (!ALLOWED_EVENTS.includes(eventName)) {
      return NextResponse.json({ status: "error", message: "Unsupported analytics event." }, { status: 400 });
    }

    const metricNames = ["LCP", "INP", "CLS", "FCP", "TTFB"];
    const metricName = typeof body?.metricName === "string" && metricNames.includes(body.metricName) ? body.metricName : undefined;
    const metricValue = typeof body?.metricValue === "number" && Number.isFinite(body.metricValue) ? body.metricValue : undefined;
    const metricRating = ["good", "needs-improvement", "poor"].includes(body?.metricRating) ? body.metricRating : undefined;
    if (eventName === "web_vital" && (!metricName || metricValue === undefined || metricValue < 0 || metricValue > 120000)) {
      return NextResponse.json({ status: "error", message: "A valid Core Web Vital metric is required." }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || "";
    if (/bot|crawler|spider|slurp|facebookexternalhit|TelegramBot|Twitterbot|LinkedInBot|Discordbot|Google-InspectionTool/i.test(userAgent)) {
      return NextResponse.json({ status: "ok", ignored: true });
    }

    const session = await getAuthenticatedSession(request);
    const visitorId = request.cookies.get("tgo_visitor_id")?.value || (ID_PATTERN.test(body?.visitorId || "") ? body.visitorId : undefined);
    const sessionId = request.cookies.get("tgo_session_id")?.value || (ID_PATTERN.test(body?.sessionId || "") ? body.sessionId : undefined);
    const eventId = ID_PATTERN.test(body?.eventId || "") ? body.eventId : randomUUID();
    await connectToDatabase();

    if (session) {
      if (visitorId) {
        await AnalyticsEvent.updateMany({ visitorId }, { $set: { isInternal: true } });
      }
      return NextResponse.json({ status: "ok", ignored: true });
    }

    const knownVisitor = visitorId
      ? await Visitor.findOne({ visitorId }).select("isInternal").lean()
      : null;

    await AnalyticsEvent.updateOne(
      { eventId },
      {
        $setOnInsert: {
          eventId,
          eventName,
          visitorId,
          sessionId,
          path: safePath(body?.path),
          target: safeTarget(body?.target),
          placement: typeof body?.placement === "string" ? body.placement.slice(0, 80) : undefined,
          itemType: typeof body?.itemType === "string" ? body.itemType.slice(0, 80) : undefined,
          itemSlug: typeof body?.itemSlug === "string" ? body.itemSlug.slice(0, 160) : undefined,
          metricName,
          metricValue,
          metricRating,
          deviceType: eventName === "web_vital" ? parseUserAgent(userAgent).deviceType : undefined,
          isInternal: Boolean(knownVisitor?.isInternal),
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[TGO Analytics] Event tracking failed:", error);
    return NextResponse.json({ status: "error", message: "Event tracking failed." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireContentPermission(session, "contactSubmissions", "viewAnalytics")) {
    return forbiddenResponse("You do not have permission to view analytics.");
  }

  const rangeParam = request.nextUrl.searchParams.get("range") || "30d";
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  const now = new Date();
  const presetDurations: Record<string, number> = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
    "365d": 365 * 24 * 60 * 60 * 1000,
    "7": 7 * 24 * 60 * 60 * 1000,
    "30": 30 * 24 * 60 * 60 * 1000,
    "90": 90 * 24 * 60 * 60 * 1000,
    "365": 365 * 24 * 60 * 60 * 1000,
  };
  const isCustomRange = Boolean(fromParam || toParam);
  let start: Date;
  let end: Date;
  if (isCustomRange) {
    start = new Date(fromParam || "");
    end = new Date(toParam || "");
    if (!fromParam || !toParam || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end || end > now) {
      return NextResponse.json({ status: "error", message: "Choose a valid reporting period ending no later than the current time." }, { status: 400 });
    }
  } else {
    const duration = presetDurations[rangeParam] || presetDurations["30d"];
    end = now;
    start = new Date(now.getTime() - duration);
  }
  const durationMs = end.getTime() - start.getTime();
  const range = isCustomRange ? "custom" : rangeParam;
  const match = { createdAt: { $gte: start, $lte: end }, isInternal: { $ne: true } };
  const eventMatch = { createdAt: { $gte: start, $lte: end }, isInternal: { $ne: true } };
  const bucketFormat = durationMs <= 48 * 60 * 60 * 1000 ? "%Y-%m-%d %H:00" : "%Y-%m-%d";

  await connectToDatabase();
  const [pageViews, visitorIds, sessionIds, topPages, countries, devices, sources, daily, eventGroups, webVitals] = await Promise.all([
    PageView.countDocuments(match),
    PageView.distinct("visitorId", match),
    PageView.distinct("sessionId", { ...match, sessionId: { $exists: true, $ne: null } }),
    PageView.aggregate([{ $match: match }, { $group: { _id: "$path", views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } }, { $project: { _id: 0, path: "$_id", views: 1, visitors: { $size: "$visitors" } } }, { $sort: { views: -1 } }, { $limit: 10 }]),
    PageView.aggregate([{ $match: { ...match, country: { $exists: true, $ne: "" } } }, { $group: { _id: "$country", visitors: { $addToSet: "$visitorId" }, views: { $sum: 1 } } }, { $project: { _id: 0, country: "$_id", visitors: { $size: "$visitors" }, views: 1 } }, { $sort: { visitors: -1 } }, { $limit: 10 }]),
    PageView.aggregate([{ $match: { ...match, deviceType: { $exists: true, $ne: "" } } }, { $group: { _id: "$deviceType", visitors: { $addToSet: "$visitorId" }, views: { $sum: 1 } } }, { $project: { _id: 0, device: "$_id", visitors: { $size: "$visitors" }, views: 1 } }, { $sort: { visitors: -1 } }]),
    PageView.aggregate([{ $match: { ...match, referrer: { $exists: true, $ne: "" } } }, { $project: { host: { $arrayElemAt: [{ $split: ["$referrer", "/"] }, 2] }, visitorId: 1 } }, { $group: { _id: "$host", visitors: { $addToSet: "$visitorId" }, views: { $sum: 1 } } }, { $project: { _id: 0, source: "$_id", visitors: { $size: "$visitors" }, views: 1 } }, { $sort: { visitors: -1 } }, { $limit: 10 }]),
    PageView.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: bucketFormat, date: "$createdAt" } }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } }, { $project: { _id: 0, date: "$_id", views: 1, visitors: { $size: "$visitors" } } }, { $sort: { date: 1 } }]),
    AnalyticsEvent.aggregate([{ $match: { ...eventMatch, eventName: { $ne: "web_vital" } } }, { $group: { _id: "$eventName", count: { $sum: 1 } } }, { $project: { _id: 0, eventName: "$_id", count: 1 } }, { $sort: { count: -1 } }]),
    AnalyticsEvent.aggregate([{ $match: { ...eventMatch, eventName: "web_vital", metricName: { $exists: true }, metricValue: { $exists: true } } }, { $group: { _id: { metricName: "$metricName", deviceType: "$deviceType" }, samples: { $sum: 1 }, average: { $avg: "$metricValue" }, worst: { $max: "$metricValue" } } }, { $project: { _id: 0, metricName: "$_id.metricName", deviceType: "$_id.deviceType", samples: 1, average: { $round: ["$average", 2] }, worst: { $round: ["$worst", 2] } } }, { $sort: { metricName: 1, deviceType: 1 } }]),
  ]);

  const eventMap = Object.fromEntries(eventGroups.map((item: { eventName: string; count: number }) => [item.eventName, item.count]));
  const conversions = (eventMap.contact_form_submitted || 0) + (eventMap.calendly_event_scheduled || 0) + (eventMap.newsletter_subscribed || 0);
  return NextResponse.json({
    status: "ok",
    range,
    since: start.toISOString(),
    until: end.toISOString(),
    summary: {
      visitors: visitorIds.length,
      pageViews,
      sessions: sessionIds.length,
      pagesPerVisitor: visitorIds.length ? Number((pageViews / visitorIds.length).toFixed(2)) : 0,
      contactSubmissions: eventMap.contact_form_submitted || 0,
      newsletterSubscriptions: eventMap.newsletter_subscribed || 0,
      completedBookings: eventMap.calendly_event_scheduled || 0,
      conversions,
    },
    events: eventGroups,
    webVitals,
    topPages,
    countries,
    devices,
    sources,
    daily,
  });
}
