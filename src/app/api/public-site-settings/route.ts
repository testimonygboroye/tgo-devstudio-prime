import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import PublicSiteSettings from "@/models/PublicSiteSettings";
import { PUBLIC_SITE_SETTINGS_DEFAULTS } from "@/lib/constants/publicSiteDefaults";

export const dynamic = "force-dynamic";

function safeHref(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim() || value.length > 500) return false;
  const href = value.trim();
  return (href.startsWith("/") && !href.startsWith("//") && !href.includes(String.fromCharCode(92))) || /^https:\/\//i.test(href) || /^mailto:[^\s]+$/i.test(href) || /^tel:[+0-9(). -]+$/i.test(href);
}

function validLinks(value: unknown): value is Array<{ label: string; href: string; icon?: string }> {
  return Array.isArray(value) && value.length <= 30 && value.every((item) =>
    item && typeof item.label === "string" && item.label.trim().length > 0 && item.label.length <= 80 &&
    safeHref(item.href) && (item.icon === undefined || (typeof item.icon === "string" && item.icon.length <= 60))
  );
}

function validGroups(value: unknown): boolean {
  return Array.isArray(value) && value.length <= 12 && value.every((group) =>
    group && typeof group.title === "string" && group.title.trim().length > 0 && group.title.length <= 80 && validLinks(group.links)
  );
}

function validFooterSections(value: unknown): boolean {
  return Array.isArray(value) && value.length <= 12 && value.every((section) =>
    section && typeof section.title === "string" && section.title.trim().length > 0 && section.title.length <= 80 && validLinks(section.links)
  );
}

function validSocialLinks(value: unknown): boolean {
  return Array.isArray(value) && value.length <= 12 && value.every((item) =>
    item && typeof item.label === "string" && item.label.trim().length > 0 && item.label.length <= 50 &&
    typeof item.platform === "string" && item.platform.length <= 40 && typeof item.href === "string" && /^https:\/\//i.test(item.href) && item.href.length <= 500
  );
}

export async function GET() {
  await connectToDatabase();
  const saved = await PublicSiteSettings.findOne().lean();
  return NextResponse.json({
    status: "ok",
    settings: { ...PUBLIC_SITE_SETTINGS_DEFAULTS, ...(saved || {}) },
    isDefault: !saved,
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function PUT(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireContentPermission(session, "pageContent", "edit")) {
    return forbiddenResponse("You do not have permission to edit global website settings.");
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ status: "error", message: "The settings payload is not valid JSON." }, { status: 400 });
  }

  const stringFields = ["brandName", "brandDescriptor", "siteTitle", "siteDescription", "faviconUrl", "openGraphImageUrl", "logoUrl", "logoAlt", "announcementText", "headerCtaLabel", "headerCtaHref", "clientPortalLabel", "clientPortalHref", "footerTagline", "footerAddress", "contactEmail", "contactPhone", "copyrightText"] as const;
  const update: Record<string, unknown> = {};
  for (const field of stringFields) {
    if (typeof body[field] !== "string") {
      return NextResponse.json({ status: "error", message: `The ${field} field must be text.` }, { status: 400 });
    }
    update[field] = body[field].trim();
  }

  if (!update.brandName || !update.logoAlt || !update.headerCtaLabel || !update.clientPortalLabel) {
    return NextResponse.json({ status: "error", message: "Brand name, logo description, and header action labels are required." }, { status: 400 });
  }
  if (!safeHref(update.logoUrl) || !safeHref(update.faviconUrl) || !safeHref(update.openGraphImageUrl) || !safeHref(update.headerCtaHref) || !safeHref(update.clientPortalHref)) {
    return NextResponse.json({ status: "error", message: "Logo and navigation destinations must use a safe internal path or HTTPS URL." }, { status: 400 });
  }
  if (update.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(update.contactEmail))) {
    return NextResponse.json({ status: "error", message: "Enter a valid contact email address." }, { status: 400 });
  }

  for (const field of ["announcementEnabled", "newsletterEnabled"] as const) {
    if (typeof body[field] !== "boolean") {
      return NextResponse.json({ status: "error", message: `The ${field} setting must be true or false.` }, { status: 400 });
    }
    update[field] = body[field];
  }
  if (!validGroups(body.navigationGroups) || !validFooterSections(body.footerSections) || !validSocialLinks(body.socialLinks)) {
    return NextResponse.json({ status: "error", message: "Check the navigation, footer and social link lists. Each item needs a valid label and safe destination." }, { status: 400 });
  }
  update.navigationGroups = body.navigationGroups;
  update.footerSections = body.footerSections;
  update.socialLinks = body.socialLinks;

  await connectToDatabase();
  const settings = await PublicSiteSettings.findOneAndUpdate(
    {},
    { $set: { ...update, lastUpdatedBy: session.user._id } },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  revalidatePath("/", "layout");
  return NextResponse.json({ status: "ok", settings }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
