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

const CONTENT_TYPE = "team";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireAnyContentPermission(session, CONTENT_TYPE)) {
    return forbiddenResponse("You do not have permission to view team members.");
  }

  await connectToDatabase();
  const teamMembers = await TeamMember.find().sort({ displayOrder: 1, createdAt: 1 });

  return NextResponse.json({ status: "ok", teamMembers });
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "create")) {
    return forbiddenResponse("You do not have permission to create team members.");
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
  } = body as {
    name?: string;
    jobTitle?: string;
    bio?: string;
    photo?: { url: string; publicId: string; altText: string };
    linkedinUrl?: string;
    githubUrl?: string;
    twitterUrl?: string;
    displayOrder?: number;
    publishStatus?: string;
  };

  if (!name || !jobTitle || !bio) {
    return NextResponse.json(
      { status: "error", message: "name, jobTitle, and bio are all required." },
      { status: 400 }
    );
  }

  if (photo && (!photo.altText || photo.altText.trim().length === 0)) {
    return NextResponse.json(
      { status: "error", message: "The photo requires alt text." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const slug = slugify(name);
  const existingMember = await TeamMember.findOne({ slug });
  if (existingMember) {
    return NextResponse.json(
      { status: "error", message: "A team member with this name already exists." },
      { status: 409 }
    );
  }

  const canPublish = requireContentPermission(session, CONTENT_TYPE, "publish");
  const resolvedPublishStatus = canPublish && publishStatus === "published" ? "published" : "draft";

  const newMember = await TeamMember.create({
    name: name.trim(),
    slug,
    jobTitle: jobTitle.trim(),
    bio: bio.trim(),
    photo,
    linkedinUrl,
    githubUrl,
    twitterUrl,
    displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
    publishStatus: resolvedPublishStatus,
    createdBy: session.user._id,
  });

  return NextResponse.json({ status: "ok", teamMember: newMember }, { status: 201 });
}
