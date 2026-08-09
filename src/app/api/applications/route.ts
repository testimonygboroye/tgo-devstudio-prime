import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import JobApplication from "@/models/JobApplication";
import JobOpening from "@/models/JobOpening";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "jobApplications";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "viewAnalytics")) {
    return forbiddenResponse("You do not have permission to view applications.");
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobOpening");
  const status = searchParams.get("status");

  const filter: Record<string, unknown> = {};
  if (jobId) filter.jobOpening = jobId;
  if (status) filter.status = status;

  const applications = await JobApplication.find(filter)
    .sort({ createdAt: -1 })
    .populate("jobOpening", "title")
    .lean();

  const jobs = await JobOpening.find().select("title").sort({ title: 1 }).lean();

  return NextResponse.json({ status: "ok", applications, jobs });
}
