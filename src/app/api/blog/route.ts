import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { getAuthenticatedSession } from "@/lib/auth/session";
import {
  unauthorizedResponse,
  forbiddenResponse,
  requireAnyContentPermission,
  requireContentPermission,
} from "@/lib/auth/authorize";
import { slugify } from "@/lib/utils/slugify";
import { validateTextLength } from "@/lib/utils/validateTextLength";
import { TEXT_LIMITS } from "@/lib/constants/textLimits";

const CONTENT_TYPE = "blogPosts";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireAnyContentPermission(session, CONTENT_TYPE)) {
    return forbiddenResponse("You do not have permission to view blog posts.");
  }

  await connectToDatabase();
  const posts = await BlogPost.find().sort({ createdAt: -1 });

  return NextResponse.json({ status: "ok", posts });
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "create")) {
    return forbiddenResponse("You do not have permission to create blog posts.");
  }

  const body = await request.json();
  const {
    title,
    excerpt,
    contentHtml,
    coverImage,
    tags,
    publishStatus,
    scheduledFor,
    metaTitle,
    metaDescription,
  } = body as {
    title?: string;
    excerpt?: string;
    contentHtml?: string;
    coverImage?: { url: string; publicId: string; altText: string };
    tags?: string[];
    publishStatus?: string;
    scheduledFor?: string;
    metaTitle?: string;
    metaDescription?: string;
  };

  if (!title || !excerpt || !contentHtml) {
    return NextResponse.json(
      { status: "error", message: "title, excerpt, and contentHtml are all required." },
      { status: 400 }
    );
  }

  const lengthError =
    validateTextLength(title, "Title", TEXT_LIMITS.blog.title) ||
    validateTextLength(excerpt, "Excerpt", TEXT_LIMITS.blog.excerpt) ||
    validateTextLength(contentHtml, "Content", TEXT_LIMITS.blog.contentHtml);

  if (lengthError) {
    return NextResponse.json({ status: "error", message: lengthError }, { status: 400 });
  }

  if (coverImage && (!coverImage.altText || coverImage.altText.trim().length === 0)) {
    return NextResponse.json(
      { status: "error", message: "The cover image requires alt text." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const slug = slugify(title);
  const existingPost = await BlogPost.findOne({ slug });
  if (existingPost) {
    return NextResponse.json(
      { status: "error", message: "A blog post with this title already exists." },
      { status: 409 }
    );
  }

  const canPublish = requireContentPermission(session, CONTENT_TYPE, "publish");

  let resolvedStatus: "draft" | "scheduled" | "published" = "draft";
  let resolvedScheduledFor: Date | undefined;

  if (canPublish && publishStatus === "published") {
    resolvedStatus = "published";
  } else if (canPublish && publishStatus === "scheduled" && scheduledFor) {
    resolvedStatus = "scheduled";
    resolvedScheduledFor = new Date(scheduledFor);
  }

  const newPost = await BlogPost.create({
    title: title.trim(),
    slug,
    excerpt: excerpt.trim(),
    contentHtml,
    coverImage,
    tags: tags ?? [],
    publishStatus: resolvedStatus,
    scheduledFor: resolvedScheduledFor,
    metaTitle,
    metaDescription,
    createdBy: session.user._id,
  });

  return NextResponse.json({ status: "ok", post: newPost }, { status: 201 });
}
