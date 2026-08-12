import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import HelpArticle from "@/models/HelpArticle";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import { canViewArticle } from "@/lib/help/visibility";
import { slugify } from "@/lib/utils/slugify";

const CONTENT_TYPE = "helpArticles";

export async function GET(request: NextRequest) {
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q");
  const preLoginOnly = searchParams.get("preLoginOnly") === "true";

  const session = await getAuthenticatedSession(request);

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }
  if (preLoginOnly) {
    filter.visibility = "preLogin";
  }

  const allArticles = await HelpArticle.find(filter).sort({ title: 1 }).lean();
  const visibleArticles = preLoginOnly
    ? allArticles
    : allArticles.filter((article) => canViewArticle(article, session));

  return NextResponse.json({ status: "ok", articles: visibleArticles });
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "create")) {
    return forbiddenResponse("You do not have permission to create help articles.");
  }

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

  const slug = slugify(title);
  const existing = await HelpArticle.findOne({ slug });
  if (existing) {
    return NextResponse.json(
      { status: "error", message: "An article with this title already exists." },
      { status: 409 }
    );
  }

  const article = await HelpArticle.create({
    title: title.trim(),
    slug,
    bodyHtml,
    visibility: (visibility as "public" | "preLogin" | "anyAuthenticated" | "permission") || "anyAuthenticated",
    requiredContentType: requiredContentType || undefined,
    category: category?.trim() || "General",
    createdBy: session.user._id,
  });

  return NextResponse.json({ status: "ok", article }, { status: 201 });
}
