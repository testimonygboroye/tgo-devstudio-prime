import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import JobApplication from "@/models/JobApplication";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "jobApplications";

interface RouteParams {
  params: Promise<{ id: string }>;
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
  const application = await JobApplication.findById(id).populate("jobOpening", "title").lean();

  if (!application) {
    return NextResponse.json({ status: "error", message: "Application not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", application });
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
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ status: "error", message: "Invalid application id." }, { status: 400 });
  const body = await request.json();
  const { status } = body as { status?: string };

  const allowedStatuses = ["new", "reviewed", "shortlisted", "rejected", "hired"];
  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json({ status: "error", message: "Invalid status." }, { status: 400 });
  }

  await connectToDatabase();
  const application = await JobApplication.findById(id);

  if (!application) {
    return NextResponse.json({ status: "error", message: "Application not found." }, { status: 404 });
  }

  const transitions: Record<string, string[]> = { reviewed: ["new"], shortlisted: ["new", "reviewed"], hired: ["shortlisted"], rejected: ["new", "reviewed", "shortlisted"], new: ["reviewed", "rejected"] };
  if (!transitions[status]?.includes(application.status)) return NextResponse.json({ status: "error", message: "This recruitment stage transition is not allowed." }, { status: 409 });
  const previousStatus = application.status;
  application.status = status as typeof application.status;
  await application.save();
  await writePlatformAuditEvent({ actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name, action: "recruitment.application_stage_changed", module: "recruitment", targetType: "job-application", targetId: id, outcome: "success", metadata: { previousStatus, nextStatus: status, jobOpeningId: String(application.jobOpening) } });
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
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ status: "error", message: "Invalid application id." }, { status: 400 });
  await connectToDatabase();
  const application = await JobApplication.findByIdAndDelete(id);

  if (!application) {
    return NextResponse.json({ status: "error", message: "Application not found." }, { status: 404 });
  }

  await writePlatformAuditEvent({ actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name, action: "recruitment.application_deleted", module: "recruitment", targetType: "job-application", targetId: id, outcome: "success", metadata: { jobOpeningId: String(application.jobOpening) } });
  return NextResponse.json({ status: "ok", message: "Application deleted." });
}
