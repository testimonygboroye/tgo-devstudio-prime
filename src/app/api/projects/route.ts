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

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireAnyContentPermission(session, CONTENT_TYPE)) {
    return forbiddenResponse("You do not have permission to view case studies.");
  }

  await connectToDatabase();
  const projects = await Project.find().sort({ createdAt: -1 });

  return NextResponse.json({ status: "ok", projects });
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "create")) {
    return forbiddenResponse("You do not have permission to create case studies.");
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

  if (!title || !summary) {
    return NextResponse.json(
      { status: "error", message: "title and summary are required." },
      { status: 400 }
    );
  }

  if (Array.isArray(images)) {
    for (const image of images) {
      if (!image.altText || image.altText.trim().length === 0) {
        return NextResponse.json(
          { status: "error", message: "Every image requires alt text." },
          { status: 400 }
        );
      }
    }
  }

  await connectToDatabase();

  const slug = slugify(title);
  const existingProject = await Project.findOne({ slug });
  if (existingProject) {
    return NextResponse.json(
      { status: "error", message: "A case study with this title already exists." },
      { status: 409 }
    );
  }

  const canPublish = requireContentPermission(session, CONTENT_TYPE, "publish");
  const resolvedPublishStatus = canPublish && publishStatus === "published" ? "published" : "draft";

  const newProject = await Project.create({
    title: title.trim(),
    slug,
    summary: summary.trim(),
    problemStatement: problemStatement ?? "",
    approach: approach ?? "",
    outcome: outcome ?? "",
    images: images ?? [],
    projectUrl,
    repoUrl,
    tags: tags ?? [],
    status: status ?? "in-progress",
    featured: Boolean(featured),
    publishStatus: resolvedPublishStatus,
    metaTitle,
    metaDescription,
    createdBy: session.user._id,
  });

  return NextResponse.json({ status: "ok", project: newProject }, { status: 201 });
}
