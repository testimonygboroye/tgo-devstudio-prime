import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import PublicPageContent, { type PublicPageKey, type IPublicPageContent } from "@/models/PublicPageContent";
import { PUBLIC_PAGE_DEFAULTS } from "@/lib/constants/publicSiteDefaults";

export const dynamic = "force-dynamic";
const PAGE_KEYS: PublicPageKey[] = ["industries", "engagement-models", "about", "contact", "process", "services", "portfolio", "blog", "team", "careers", "testimonials", "stack", "help", "book-a-call", "services-catalogue"];

function safeHref(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 500) return false;
  const href = value.trim();
  return (href.startsWith("/") && !href.startsWith("//")) || /^https:\/\//i.test(href);
}

function validCards(value: unknown): value is Array<{
  icon: string; eyebrow: string; title: string; subtitle: string; description: string; bulletPoints: string[]; displayOrder: number;
}> {
  return Array.isArray(value) && value.length <= 30 && value.every((card) =>
    card && typeof card.title === "string" && card.title.trim().length > 0 && card.title.length <= 120 &&
    typeof card.description === "string" && card.description.trim().length > 0 && card.description.length <= 1200 &&
    typeof card.icon === "string" && card.icon.length <= 60 &&
    typeof card.eyebrow === "string" && card.eyebrow.length <= 100 &&
    typeof card.subtitle === "string" && card.subtitle.length <= 200 &&
    Array.isArray(card.bulletPoints) && card.bulletPoints.length <= 12 && card.bulletPoints.every((item: unknown) => typeof item === "string" && item.length <= 180) &&
    Number.isFinite(card.displayOrder)
  );
}

type RouteContext = { params: Promise<{ pageKey: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { pageKey } = await context.params;
  if (!PAGE_KEYS.includes(pageKey as PublicPageKey)) {
    return NextResponse.json({ status: "error", message: "Unknown public page." }, { status: 404 });
  }
  const resolvedPageKey = pageKey as PublicPageKey;
  await connectToDatabase();
  const saved = await PublicPageContent.findOne({ pageKey: resolvedPageKey }).lean();
  return NextResponse.json({
    status: "ok",
    settings: { ...PUBLIC_PAGE_DEFAULTS[pageKey as PublicPageKey], ...(saved || {}), pageKey },
    isDefault: !saved,
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireContentPermission(session, "pageContent", "edit")) {
    return forbiddenResponse("You do not have permission to edit public landing pages.");
  }

  const { pageKey } = await context.params;
  if (!PAGE_KEYS.includes(pageKey as PublicPageKey)) {
    return NextResponse.json({ status: "error", message: "Unknown public page." }, { status: 404 });
  }
  const resolvedPageKey = pageKey as PublicPageKey;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ status: "error", message: "The page content is not valid JSON." }, { status: 400 });
  }

  const fields = ["metaTitle", "metaDescription", "heroEyebrow", "heroHeadline", "heroAccent", "heroDescription", "heroNote", "introEyebrow", "introHeading", "introDescription", "ctaEyebrow", "ctaHeading", "ctaDescription", "ctaPrimaryLabel", "ctaPrimaryHref", "ctaSecondaryLabel", "ctaSecondaryHref"] as const;
  const update: Record<string, unknown> = { pageKey: resolvedPageKey };
  for (const field of fields) {
    if (typeof body[field] !== "string") {
      return NextResponse.json({ status: "error", message: `The ${field} field must be text.` }, { status: 400 });
    }
    update[field] = body[field].trim();
  }
  if (!update.heroHeadline || !update.heroDescription || !update.ctaPrimaryLabel) {
    return NextResponse.json({ status: "error", message: "A hero headline, hero description and primary CTA label are required." }, { status: 400 });
  }
  if (!safeHref(update.ctaPrimaryHref) || (update.ctaSecondaryHref && !safeHref(update.ctaSecondaryHref))) {
    return NextResponse.json({ status: "error", message: "CTA destinations must be safe internal paths or HTTPS URLs." }, { status: 400 });
  }
  if (!validCards(body.cards)) {
    return NextResponse.json({ status: "error", message: "Every card needs a title, description, icon, bullet list and display order." }, { status: 400 });
  }
  update.cards = body.cards;

  await connectToDatabase();
  const mongoUpdate = { ...update, lastUpdatedBy: session.user._id } as Partial<IPublicPageContent>;
  const saved = await PublicPageContent.findOneAndUpdate(
    { pageKey: resolvedPageKey },
    { $set: mongoUpdate },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  revalidatePath(resolvedPageKey === "industries" ? "/industries" : "/engagement-models");
  return NextResponse.json({ status: "ok", settings: saved }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
