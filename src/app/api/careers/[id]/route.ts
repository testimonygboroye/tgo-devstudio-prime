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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireAnyContentPermission(session, CONTENT_TYPE)) {
    return forbiddenResponse("You do not have permission to view job openings.");
  }

  const { id } = await params;
  await connectToDatabase();
  const job = await JobOpening.findById(id);

  if (!job) {
    return NextResponse.json({ status: "error", message: "Job opening not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", job });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit job openings.");
  }

  const { id } = await params;
  await connectToDatabase();
  const job = await JobOpening.findById(id);

  if (!job) {
    return NextResponse.json({ status: "error", message: "Job opening not found." }, { status: 404 });
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

  const lengthError =
    validateTextLength(title, "Title", TEXT_LIMITS.job.title) ||
    validateTextLength(summary, "Summary", TEXT_LIMITS.job.summary) ||
    validateTextLength(responsibilities, "Responsibilities", TEXT_LIMITS.job.responsibilities) ||
    validateTextLength(requirements, "Requirements", TEXT_LIMITS.job.requirements);

  if (lengthError) {
    return NextResponse.json({ status: "error", message: lengthError }, { status: 400 });
  }

  if (title && title.trim().length > 0) {
    job.title = title.trim();
    job.slug = slugify(title);
  }
  if (department !== undefined) job.department = department;
  if (locationType !== undefined) job.locationType = normalizeLocationType(locationType);
  if (employmentType !== undefined) job.employmentType = normalizeEmploymentType(employmentType);
  if (summary !== undefined) job.summary = summary.trim();
  if (responsibilities !== undefined) job.responsibilities = responsibilities;
  if (requirements !== undefined) job.requirements = requirements;
  if (applyEmail !== undefined) job.applyEmail = applyEmail;
  if (applyUrl !== undefined) job.applyUrl = applyUrl;

  if (publishStatus !== undefined) {
    if (publishStatus === "published") {
      if (!requireContentPermission(session, CONTENT_TYPE, "publish")) {
        return forbiddenResponse("You do not have permission to publish job openings.");
      }
      job.publishStatus = "published";
    } else {
      job.publishStatus = "draft";
    }
  }

  await job.save();

  return NextResponse.json({ status: "ok", job });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete job openings.");
  }

  const { id } = await params;
  await connectToDatabase();
  const job = await JobOpening.findById(id);

  if (!job) {
    return NextResponse.json({ status: "error", message: "Job opening not found." }, { status: 404 });
  }

  await job.deleteOne();

  return NextResponse.json({ status: "ok", message: "Job opening deleted." });
}
