import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import JobApplication from "@/models/JobApplication";
import ContactSubmission from "@/models/ContactSubmission";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, requireContentPermission } from "@/lib/auth/authorize";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  await connectToDatabase();
  const counts: Record<string, number> = {};

  if (requireContentPermission(session, "jobApplications", "viewAnalytics")) {
    counts.jobApplications = await JobApplication.countDocuments({ status: "new" });
  }

  if (requireContentPermission(session, "contactSubmissions", "viewAnalytics")) {
    counts.contactSubmissions = await ContactSubmission.countDocuments({ status: "new" });
  }

  return NextResponse.json({ status: "ok", counts });
}
