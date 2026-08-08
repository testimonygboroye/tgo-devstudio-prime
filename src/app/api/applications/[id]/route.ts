import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import JobApplication from "@/models/JobApplication";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "jobApplications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to update applications.");
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body as { status?: string };

  const allowedStatuses = ["new", "reviewed", "shortlisted", "rejected", "hired"];
  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json({ status: "error", message: "Invalid status." }, { status: 400 });
  }

  await connectToDatabase();
  const application = await JobApplication.findByIdAndUpdate(id, { status }, { new: true });

  if (!application) {
    return NextResponse.json({ status: "error", message: "Application not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", application });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete applications.");
  }

  const { id } = await params;
  await connectToDatabase();
  const application = await JobApplication.findByIdAndDelete(id);

  if (!application) {
    return NextResponse.json({ status: "error", message: "Application not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", message: "Application deleted." });
}
