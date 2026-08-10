import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ProcessStep from "@/models/ProcessStep";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "processSteps";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "create")) {
    return forbiddenResponse("You do not have permission to create process steps.");
  }

  const body = await request.json();
  const { title, description, displayOrder, publishStatus, featured } = body as {
    title?: string;
    description?: string;
    displayOrder?: number;
    publishStatus?: string;
    featured?: boolean;
  };

  if (!title || !description) {
    return NextResponse.json(
      { status: "error", message: "Title and description are required." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const step = await ProcessStep.create({
    title: title.trim(),
    description: description.trim(),
    displayOrder: displayOrder ?? 0,
    publishStatus: publishStatus === "published" ? "published" : "draft",
    featured: featured === true,
    createdBy: session.user._id,
  });

  return NextResponse.json({ status: "ok", step }, { status: 201 });
}
