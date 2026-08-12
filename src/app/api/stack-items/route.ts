import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import StackItem from "@/models/StackItem";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "stackItems";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "create")) {
    return forbiddenResponse("You do not have permission to create stack items.");
  }

  const body = await request.json();
  const { category, title, description, displayOrder, publishStatus } = body as {
    category?: string;
    title?: string;
    description?: string;
    displayOrder?: number;
    publishStatus?: string;
  };

  if (!category || !title || !description) {
    return NextResponse.json(
      { status: "error", message: "Category, title, and description are required." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const item = await StackItem.create({
    category: category.trim(),
    title: title.trim(),
    description: description.trim(),
    displayOrder: displayOrder ?? 0,
    publishStatus: publishStatus === "published" ? "published" : "draft",
    createdBy: session.user._id,
  });

  return NextResponse.json({ status: "ok", item }, { status: 201 });
}
