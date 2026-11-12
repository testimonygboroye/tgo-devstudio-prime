import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import PageContent, { PageContentType } from "@/models/PageContent";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import { PAGE_DEFAULTS } from "@/lib/constants/pageDefaults";
import { PAGE_CONTENT_VERSION } from "@/lib/constants/legalContent";

const CONTENT_TYPE = "pageContent";
const VALID_TYPES: PageContentType[] = ["about", "privacy-policy", "terms-of-service", "usage-policy", "accessibility", "data-deletion"];

interface RouteParams {
  params: Promise<{ type: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as PageContentType)) {
    return NextResponse.json({ status: "error", message: "Invalid page type." }, { status: 400 });
  }
  const resolvedType = type as PageContentType;
  await connectToDatabase();
  const saved = await PageContent.findOne({ type: resolvedType }).lean();
  if (saved && (resolvedType === "about" || saved.contentVersion === PAGE_CONTENT_VERSION)) {
    return NextResponse.json({ status: "ok", page: saved, isDefault: false }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
  }
  const fallback = PAGE_DEFAULTS[resolvedType];
  return NextResponse.json({
    status: "ok",
    page: { type: resolvedType, title: fallback.title, content: fallback.content },
    isDefault: true,
  }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit this page.");
  }
  const { type } = await params;
  if (!VALID_TYPES.includes(type as PageContentType)) {
    return NextResponse.json({ status: "error", message: "Invalid page type." }, { status: 400 });
  }
  const resolvedType = type as PageContentType;
  const body = await request.json();
  const { title, content } = body as { title?: string; content?: string };
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ status: "error", message: "Title and content are required." }, { status: 400 });
  }
  if (title.trim().length > 150 || content.length > 100000) {
    return NextResponse.json({ status: "error", message: "Page title or content exceeds the permitted size." }, { status: 400 });
  }
  await connectToDatabase();
  const sanitizedContent = sanitizeBlogHtml(content);
  const page = await PageContent.findOneAndUpdate(
    { type: resolvedType },
    {
      type: resolvedType,
      title: title.trim(),
      content: sanitizedContent,
      lastUpdatedBy: session.user._id,
      contentVersion: PAGE_CONTENT_VERSION,
      translations: resolvedType === "about" ? undefined : {},
    },
    { new: true, upsert: true }
  );
  revalidatePath(resolvedType === "about" ? "/about" : `/${resolvedType}`);
  return NextResponse.json({ status: "ok", page });
}
