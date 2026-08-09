import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ContactSubmission from "@/models/ContactSubmission";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "contactSubmissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "viewAnalytics")) {
    return forbiddenResponse("You do not have permission to view contact messages.");
  }

  const { id } = await params;
  await connectToDatabase();
  const submission = await ContactSubmission.findById(id).lean();

  if (!submission) {
    return NextResponse.json({ status: "error", message: "Message not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", submission });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to update contact messages.");
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body as { status?: string };

  const allowedStatuses = ["new", "read", "replied", "archived"];
  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json({ status: "error", message: "Invalid status." }, { status: 400 });
  }

  await connectToDatabase();
  const submission = await ContactSubmission.findByIdAndUpdate(id, { status }, { new: true });

  if (!submission) {
    return NextResponse.json({ status: "error", message: "Message not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", submission });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete contact messages.");
  }

  const { id } = await params;
  await connectToDatabase();
  const submission = await ContactSubmission.findByIdAndDelete(id);

  if (!submission) {
    return NextResponse.json({ status: "error", message: "Message not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", message: "Message deleted." });
}
