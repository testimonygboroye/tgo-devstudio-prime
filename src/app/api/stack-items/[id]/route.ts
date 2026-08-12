import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import StackItem from "@/models/StackItem";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "stackItems";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit stack items.");
  }

  const { id } = await params;
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

  const item = await StackItem.findByIdAndUpdate(
    id,
    {
      category: category.trim(),
      title: title.trim(),
      description: description.trim(),
      displayOrder: displayOrder ?? 0,
      publishStatus: publishStatus === "published" ? "published" : "draft",
    },
    { new: true }
  );

  if (!item) {
    return NextResponse.json({ status: "error", message: "Stack item not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", item });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete stack items.");
  }

  const { id } = await params;
  await connectToDatabase();
  const item = await StackItem.findByIdAndDelete(id);

  if (!item) {
    return NextResponse.json({ status: "error", message: "Stack item not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", message: "Stack item deleted." });
}
