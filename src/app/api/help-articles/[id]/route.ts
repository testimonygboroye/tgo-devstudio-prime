import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import HelpArticle from "@/models/HelpArticle";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import { canViewArticle } from "@/lib/help/visibility";
import { slugify } from "@/lib/utils/slugify";

const CONTENT_TYPE = "helpArticles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await connectToDatabase();

  const article = await HelpArticle.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }],
  }).lean();

  if (!article) {
    return NextResponse.json({ status: "error", message: "Article not found." }, { status: 404 });
  }

  const session = await getAuthenticatedSession(request);
  if (!canViewArticle(article, session)) {
    return forbiddenResponse("You do not have permission to view this article.");
  }

  return NextResponse.json({ status: "ok", article });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit help articles.");
  }

  const { id } = await params;
  const body = await request.json();
  const { title, bodyHtml, visibility, requiredContentType, category } = body as {
    title?: string;
    bodyHtml?: string;
    visibility?: string;
    requiredContentType?: string;
    category?: string;
  };

  if (!title || !bodyHtml) {
    return NextResponse.json({ status: "error", message: "Title and content are required." }, { status: 400 });
  }

  await connectToDatabase();

  const article = await HelpArticle.findById(id);
  if (!article) {
    return NextResponse.json({ status: "error", message: "Article not found." }, { status: 404 });
  }

  article.title = title.trim();
  article.slug = slugify(title);
  article.bodyHtml = bodyHtml;
  article.visibility = (visibility as typeof article.visibility) || "anyAuthenticated";
  article.requiredContentType = requiredContentType || undefined;
  article.category = category?.trim() || "General";

  await article.save();

  return NextResponse.json({ status: "ok", article });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete help articles.");
  }

  const { id } = await params;
  await connectToDatabase();
  const article = await HelpArticle.findByIdAndDelete(id);

  if (!article) {
    return NextResponse.json({ status: "error", message: "Article not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", message: "Article deleted." });
}
