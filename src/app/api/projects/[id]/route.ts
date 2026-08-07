import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import { getAuthenticatedSession } from "@/lib/auth/session";
import {
  unauthorizedResponse,
  forbiddenResponse,
  requireAnyContentPermission,
  requireContentPermission,
} from "@/lib/auth/authorize";
import { slugify } from "@/lib/utils/slugify";

const CONTENT_TYPE = "caseStudies";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireAnyContentPermission(session, CONTENT_TYPE)) {
    return forbiddenResponse("You do not have permission to view case studies.");
  }

  const { id } = await params;
  await connectToDatabase();
  const project = await Project.findById(id);

  if (!project) {
    return NextResponse.json({ status: "error", message: "Case study not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", project });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit case studies.");
  }

  const { id } = await params;
  await connectToDatabase();
  const project = await Project.findById(id);

  if (!project) {
    return NextResponse.json({ status: "error", message: "Case study not found." }, { status: 404 });
  }

  const body = await request.json();
  const {
    title,
    summary,
    problemStatement,
    approach,
    outcome,
    images,
    projectUrl,
    repoUrl,
    tags,
    status,
    featured,
    publishStatus,
    metaTitle,
    metaDescription,
  } = body as {
    title?: string;
    summary?: string;
    problemStatement?: string;
    approach?: string;
    outcome?: string;
    images?: { url: string; publicId: string; altText: string }[];
    projectUrl?: string;
    repoUrl?: string;
    tags?: string[];
    status?: string;
    featured?: boolean;
    publishStatus?: string;
    metaTitle?: string;
    metaDescription?: string;
  };

  if (Array.isArray(images)) {
    for (const image of images) {
      if (!image.altText || image.altText.trim().length === 0) {
        return NextResponse.json(
          { status: "error", message: "Every image requires alt text." },
          { status: 400 }
        );
      }
    }
    project.images = images;
  }

  if (title && title.trim().length > 0) {
    project.title = title.trim();
    project.slug = slugify(title);
  }
  if (summary) project.summary = summary.trim();
  if (problemStatement !== undefined) project.problemStatement = problemStatement;
  if (approach !== undefined) project.approach = approach;
  if (outcome !== undefined) project.outcome = outcome;
  if (projectUrl !== undefined) project.projectUrl = projectUrl;
  if (repoUrl !== undefined) project.repoUrl = repoUrl;
  if (tags !== undefined) project.tags = tags;
  if (status !== undefined) project.status = status as typeof project.status;
  if (featured !== undefined) project.featured = Boolean(featured);
  if (metaTitle !== undefined) project.metaTitle = metaTitle;
  if (metaDescription !== undefined) project.metaDescription = metaDescription;

  if (publishStatus !== undefined) {
    if (publishStatus === "published") {
      if (!requireContentPermission(session, CONTENT_TYPE, "publish")) {
        return forbiddenResponse("You do not have permission to publish case studies.");
      }
      project.publishStatus = "published";
    } else {
      project.publishStatus = "draft";
    }
  }

  await project.save();

  return NextResponse.json({ status: "ok", project });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete case studies.");
  }

  const { id } = await params;
  await connectToDatabase();
  const project = await Project.findById(id);

  if (!project) {
    return NextResponse.json({ status: "error", message: "Case study not found." }, { status: 404 });
  }

  await project.deleteOne();

  return NextResponse.json({ status: "ok", message: "Case study deleted." });
}
