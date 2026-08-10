import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ProcessStep from "@/models/ProcessStep";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "processSteps";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit process steps.");
  }

  const { id } = await params;
  const body = await request.json();
  const { title, description, displayOrder, publishStatus } = body as {
    title?: string;
    description?: string;
    displayOrder?: number;
    publishStatus?: string;
  };

  if (!title || !description) {
    return NextResponse.json(
      { status: "error", message: "Title and description are required." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const step = await ProcessStep.findByIdAndUpdate(
    id,
    {
      title: title.trim(),
      description: description.trim(),
      displayOrder: displayOrder ?? 0,
      publishStatus: publishStatus === "published" ? "published" : "draft",
    },
    { new: true }
  );

  if (!step) {
    return NextResponse.json({ status: "error", message: "Process step not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", step });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete process steps.");
  }

  const { id } = await params;
  await connectToDatabase();
  const step = await ProcessStep.findByIdAndDelete(id);

  if (!step) {
    return NextResponse.json({ status: "error", message: "Process step not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", message: "Process step deleted." });
}
