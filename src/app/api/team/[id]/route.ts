import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import TeamMember from "@/models/TeamMember";
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

const CONTENT_TYPE = "team";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireAnyContentPermission(session, CONTENT_TYPE)) {
    return forbiddenResponse("You do not have permission to view team members.");
  }

  const { id } = await params;
  await connectToDatabase();
  const teamMember = await TeamMember.findById(id);

  if (!teamMember) {
    return NextResponse.json({ status: "error", message: "Team member not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", teamMember });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit team members.");
  }

  const { id } = await params;
  await connectToDatabase();
  const teamMember = await TeamMember.findById(id);

  if (!teamMember) {
    return NextResponse.json({ status: "error", message: "Team member not found." }, { status: 404 });
  }

  const body = await request.json();
  const {
    name,
    jobTitle,
    bio,
    photo,
    linkedinUrl,
    githubUrl,
    twitterUrl,
    displayOrder,
    publishStatus,
    featured,
  } = body as {
    name?: string;
    jobTitle?: string;
    bio?: string;
    photo?: { url: string; publicId: string; altText: string } | null;
    linkedinUrl?: string;
    githubUrl?: string;
    twitterUrl?: string;
    displayOrder?: number;
    publishStatus?: string;
    featured?: boolean;
  };

  const lengthError =
    validateTextLength(name, "Name", TEXT_LIMITS.team.name) ||
    validateTextLength(jobTitle, "Job title", TEXT_LIMITS.team.jobTitle) ||
    validateTextLength(bio, "Bio", TEXT_LIMITS.team.bio);

  if (lengthError) {
    return NextResponse.json({ status: "error", message: lengthError }, { status: 400 });
  }

  if (photo && (!photo.altText || photo.altText.trim().length === 0)) {
    return NextResponse.json(
      { status: "error", message: "The photo requires alt text." },
      { status: 400 }
    );
  }

  if (name && name.trim().length > 0) {
    teamMember.name = name.trim();
    teamMember.slug = slugify(name);
  }
  if (jobTitle !== undefined) teamMember.jobTitle = jobTitle.trim();
  if (bio !== undefined) teamMember.bio = bio.trim();
  if (photo !== undefined) teamMember.photo = photo ?? undefined;
  if (linkedinUrl !== undefined) teamMember.linkedinUrl = linkedinUrl;
  if (githubUrl !== undefined) teamMember.githubUrl = githubUrl;
  if (twitterUrl !== undefined) teamMember.twitterUrl = twitterUrl;
  if (typeof displayOrder === "number") teamMember.displayOrder = displayOrder;
  if (typeof featured === "boolean") teamMember.featured = featured;

  if (publishStatus !== undefined) {
    if (publishStatus === "published") {
      if (!requireContentPermission(session, CONTENT_TYPE, "publish")) {
        return forbiddenResponse("You do not have permission to publish team members.");
      }
      teamMember.publishStatus = "published";
    } else {
      teamMember.publishStatus = "draft";
    }
  }

  await teamMember.save();

  return NextResponse.json({ status: "ok", teamMember });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete team members.");
  }

  const { id } = await params;
  await connectToDatabase();
  const teamMember = await TeamMember.findById(id);

  if (!teamMember) {
    return NextResponse.json({ status: "error", message: "Team member not found." }, { status: 404 });
  }

  await teamMember.deleteOne();

  return NextResponse.json({ status: "ok", message: "Team member deleted." });
}
