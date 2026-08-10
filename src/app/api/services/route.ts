import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "services";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "create")) {
    return forbiddenResponse("You do not have permission to create services.");
  }

  const body = await request.json();
  const { title, summary, icon, displayOrder, publishStatus, featured } = body as {
    title?: string;
    summary?: string;
    icon?: string;
    displayOrder?: number;
    publishStatus?: string;
    featured?: boolean;
  };

  if (!title || !summary) {
    return NextResponse.json({ status: "error", message: "Title and summary are required." }, { status: 400 });
  }

  await connectToDatabase();

  const service = await Service.create({
    title: title.trim(),
    summary: summary.trim(),
    icon: icon || "Code",
    displayOrder: displayOrder ?? 0,
    publishStatus: publishStatus === "published" ? "published" : "draft",
    featured: featured === true,
    createdBy: session.user._id,
  });

  return NextResponse.json({ status: "ok", service }, { status: 201 });
}
