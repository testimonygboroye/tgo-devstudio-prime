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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireAnyContentPermission(session, CONTENT_TYPE)) {
    return forbiddenResponse("You do not have permission to view blog posts.");
  }

  const { id } = await params;
  await connectToDatabase();
  const post = await BlogPost.findById(id);

  if (!post) {
    return NextResponse.json({ status: "error", message: "Blog post not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", post });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit blog posts.");
  }

  const { id } = await params;
  await connectToDatabase();
  const post = await BlogPost.findById(id);

  if (!post) {
    return NextResponse.json({ status: "error", message: "Blog post not found." }, { status: 404 });
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
    featured,
  } = body as {
    title?: string;
    excerpt?: string;
    contentHtml?: string;
    coverImage?: { url: string; publicId: string; altText: string } | null;
    tags?: string[];
    publishStatus?: string;
    scheduledFor?: string;
    metaTitle?: string;
    metaDescription?: string;
    featured?: boolean;
  };

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

  if (title && title.trim().length > 0) {
    post.title = title.trim();
    post.slug = slugify(title);
  }
  if (excerpt !== undefined) post.excerpt = excerpt.trim();
  if (contentHtml !== undefined) post.contentHtml = contentHtml;
  if (coverImage !== undefined) post.coverImage = coverImage ?? undefined;
  if (tags !== undefined) post.tags = tags;
  if (metaTitle !== undefined) post.metaTitle = metaTitle;
  if (metaDescription !== undefined) post.metaDescription = metaDescription;
  if (typeof featured === "boolean") post.featured = featured;

  if (publishStatus !== undefined) {
    const canPublish = requireContentPermission(session, CONTENT_TYPE, "publish");

    if (publishStatus === "published") {
      if (!canPublish) {
        return forbiddenResponse("You do not have permission to publish blog posts.");
      }
      post.publishStatus = "published";
      post.scheduledFor = undefined;
    } else if (publishStatus === "scheduled") {
      if (!canPublish) {
        return forbiddenResponse("You do not have permission to schedule blog posts.");
      }
      if (!scheduledFor) {
        return NextResponse.json(
          { status: "error", message: "scheduledFor is required when scheduling a post." },
          { status: 400 }
        );
      }
      post.publishStatus = "scheduled";
      post.scheduledFor = new Date(scheduledFor);
    } else {
      post.publishStatus = "draft";
      post.scheduledFor = undefined;
    }
  }

  await post.save();

  return NextResponse.json({ status: "ok", post });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete blog posts.");
  }

  const { id } = await params;
  await connectToDatabase();
  const post = await BlogPost.findById(id);

  if (!post) {
    return NextResponse.json({ status: "error", message: "Blog post not found." }, { status: 404 });
  }

  await post.deleteOne();

  return NextResponse.json({ status: "ok", message: "Blog post deleted." });
}
