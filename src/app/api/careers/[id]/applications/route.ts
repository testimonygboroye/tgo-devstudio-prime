import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import JobOpening from "@/models/JobOpening";
import JobApplication from "@/models/JobApplication";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import { notifyNewApplication } from "@/lib/email/notifyNewApplication";
import { verifyTurnstileToken } from "@/lib/turnstile";

const CONTENT_TYPE = "jobApplications";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 3;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const {
    applicantName,
    applicantEmail,
    applicantPhone,
    coverMessage,
    profilePhotoUrl,
    resumeUrl,
    resumePublicId,
    companyWebsite,
    turnstileToken,
  } = body as {
    applicantName?: string;
    applicantEmail?: string;
    applicantPhone?: string;
    coverMessage?: string;
    profilePhotoUrl?: string;
    resumeUrl?: string;
    resumePublicId?: string;
    companyWebsite?: string;
    turnstileToken?: string;
  };

  if (companyWebsite) {
    return NextResponse.json({ status: "ok", message: "Application received." });
  }

  if (!applicantName || !applicantEmail || !coverMessage || !resumeUrl || !resumePublicId || !profilePhotoUrl) {
    return NextResponse.json(
      { status: "error", message: "Name, email, cover message, profile photo, and resume are all required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
    return NextResponse.json({ status: "error", message: "Invalid email format." }, { status: 400 });
  }

  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const isHuman = await verifyTurnstileToken(turnstileToken || "", remoteIp);
  if (!isHuman) {
    return NextResponse.json(
      { status: "error", message: "Verification failed. Please try again." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const job = await JobOpening.findOne({ _id: id, publishStatus: "published" });
  if (!job) {
    return NextResponse.json({ status: "error", message: "Job opening not found." }, { status: 404 });
  }

  const recentCount = await JobApplication.countDocuments({
    createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
    applicantEmail: applicantEmail.toLowerCase(),
  });

  if (recentCount >= RATE_LIMIT_MAX_SUBMISSIONS) {
    return NextResponse.json(
      { status: "error", message: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  const application = await JobApplication.create({
    jobOpening: job._id,
    applicantName: applicantName.trim(),
    applicantEmail: applicantEmail.toLowerCase(),
    applicantPhone,
    coverMessage: coverMessage.trim(),
    profilePhotoUrl,
    resumeUrl,
    resumePublicId,
  });

  notifyNewApplication({
    applicantName: application.applicantName,
    applicantEmail: application.applicantEmail,
    jobTitle: job.title,
    applicationId: application._id.toString(),
  }).catch((err) => console.error("notifyNewApplication failed:", err));

  return NextResponse.json({ status: "ok", message: "Application received." }, { status: 201 });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "viewAnalytics")) {
    return forbiddenResponse("You do not have permission to view applications.");
  }

  const { id } = await params;
  await connectToDatabase();
  const applications = await JobApplication.find({ jobOpening: id }).sort({ createdAt: -1 });

  return NextResponse.json({ status: "ok", applications });
}
