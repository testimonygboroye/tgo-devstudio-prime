import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import JobOpening from "@/models/JobOpening";
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
import { normalizeLocationType, normalizeEmploymentType } from "@/lib/utils/jobEnums";

const CONTENT_TYPE = "jobOpenings";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireAnyContentPermission(session, CONTENT_TYPE)) {
    return forbiddenResponse("You do not have permission to view job openings.");
  }

  await connectToDatabase();
  const jobs = await JobOpening.find().sort({ createdAt: -1 });

  return NextResponse.json({ status: "ok", jobs });
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "create")) {
    return forbiddenResponse("You do not have permission to create job openings.");
  }

  const body = await request.json();
  const {
    title,
    department,
    locationType,
    employmentType,
    summary,
    responsibilities,
    requirements,
    applyEmail,
    applyUrl,
    publishStatus,
  } = body as {
    title?: string;
    department?: string;
    locationType?: string;
    employmentType?: string;
    summary?: string;
    responsibilities?: string;
    requirements?: string;
    applyEmail?: string;
    applyUrl?: string;
    publishStatus?: string;
  };

  if (!title || !summary) {
    return NextResponse.json(
      { status: "error", message: "title and summary are required." },
      { status: 400 }
    );
  }

  const lengthError =
    validateTextLength(title, "Title", TEXT_LIMITS.job.title) ||
    validateTextLength(summary, "Summary", TEXT_LIMITS.job.summary) ||
    validateTextLength(responsibilities, "Responsibilities", TEXT_LIMITS.job.responsibilities) ||
    validateTextLength(requirements, "Requirements", TEXT_LIMITS.job.requirements);

  if (lengthError) {
    return NextResponse.json({ status: "error", message: lengthError }, { status: 400 });
  }

  if (!applyEmail && !applyUrl) {
    return NextResponse.json(
      { status: "error", message: "Provide at least an apply email or an apply URL." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const slug = slugify(title);
  const existingJob = await JobOpening.findOne({ slug });
  if (existingJob) {
    return NextResponse.json(
      { status: "error", message: "A job opening with this title already exists." },
      { status: 409 }
    );
  }

  const canPublish = requireContentPermission(session, CONTENT_TYPE, "publish");
  const resolvedPublishStatus = canPublish && publishStatus === "published" ? "published" : "draft";

  const newJob = await JobOpening.create({
    title: title.trim(),
    slug,
    department,
    locationType: normalizeLocationType(locationType),
    employmentType: normalizeEmploymentType(employmentType),
    summary: summary.trim(),
    responsibilities: responsibilities ?? "",
    requirements: requirements ?? "",
    applyEmail,
    applyUrl,
    publishStatus: resolvedPublishStatus,
    createdBy: session.user._id,
  });

  return NextResponse.json({ status: "ok", job: newJob }, { status: 201 });
}
