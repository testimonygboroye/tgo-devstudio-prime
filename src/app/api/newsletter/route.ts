import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectToDatabase } from "@/lib/db";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import AnalyticsEvent from "@/models/AnalyticsEvent";
import Visitor from "@/models/Visitor";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { verifyTurnstileToken } from "@/lib/turnstile";

const CONTENT_TYPE = "newsletterSubscribers";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const RATE_LIMIT_MAX_SUBMISSIONS = 3;

async function recordNewsletterConversion(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request);
    const visitorId = request.cookies.get("tgo_visitor_id")?.value;
    const visitor = visitorId ? await Visitor.findOne({ visitorId }).select("isInternal").lean() : null;
    await AnalyticsEvent.create({
      eventId: randomUUID(),
      eventName: "newsletter_subscribed",
      visitorId,
      sessionId: request.cookies.get("tgo_session_id")?.value,
      path: "/",
      isInternal: Boolean(session || visitor?.isInternal),
    });
  } catch (error) {
    console.error("[TGO Analytics] Newsletter conversion event failed:", error);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, companyWebsite, turnstileToken } = body as {
    email?: string;
    companyWebsite?: string;
    turnstileToken?: string;
  };

  if (companyWebsite) {
    return NextResponse.json({ status: "ok", message: "Subscribed." });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ status: "error", message: "A valid email is required." }, { status: 400 });
  }

  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const isHuman = await verifyTurnstileToken(turnstileToken || "", remoteIp);
  if (!isHuman) {
    return NextResponse.json({ status: "error", message: "Verification failed. Please try again." }, { status: 400 });
  }

  await connectToDatabase();

  const recentCount = await NewsletterSubscriber.countDocuments({
    createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
  });
  if (recentCount >= RATE_LIMIT_MAX_SUBMISSIONS * 20) {
    return NextResponse.json({ status: "error", message: "Too many submissions. Please try again later." }, { status: 429 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await NewsletterSubscriber.findOne({ email: normalizedEmail });

  if (existing) {
    if (existing.status === "subscribed") {
      return NextResponse.json({ status: "ok", message: "You're already subscribed." });
    }
    existing.status = "subscribed";
    await existing.save();
    await recordNewsletterConversion(request);
    return NextResponse.json({ status: "ok", message: "Welcome back! You're subscribed again." });
  }

  const rawToken = generateRawToken();
  await NewsletterSubscriber.create({
    email: normalizedEmail,
    status: "subscribed",
    unsubscribeTokenHash: hashToken(rawToken),
  });
  await recordNewsletterConversion(request);

  return NextResponse.json({ status: "ok", message: "Subscribed successfully." }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireContentPermission(session, CONTENT_TYPE, "viewAnalytics")) {
    return forbiddenResponse("You do not have permission to view newsletter subscribers.");
  }

  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const subscribers = await NewsletterSubscriber.find(filter).select("email status createdAt").sort({ createdAt: -1 }).lean();
  return NextResponse.json({ status: "ok", subscribers });
}
