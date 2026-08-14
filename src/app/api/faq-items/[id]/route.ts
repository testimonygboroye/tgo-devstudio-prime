import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "faqItems";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit FAQ items.");
  }

  const { id } = await params;
  const body = await request.json();
  const { question, answer, category, displayOrder, publishStatus } = body as {
    question?: string;
    answer?: string;
    category?: string;
    displayOrder?: number;
    publishStatus?: string;
  };

  if (!question || !answer) {
    return NextResponse.json({ status: "error", message: "Question and answer are required." }, { status: 400 });
  }

  await connectToDatabase();

  const item = await FaqItem.findByIdAndUpdate(
    id,
    {
      question: question.trim(),
      answer: answer.trim(),
      category: category?.trim() || "General",
      displayOrder: displayOrder ?? 0,
      publishStatus: publishStatus === "published" ? "published" : "draft",
    },
    { new: true }
  );

  if (!item) {
    return NextResponse.json({ status: "error", message: "FAQ item not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", item });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete FAQ items.");
  }

  const { id } = await params;
  await connectToDatabase();
  const item = await FaqItem.findByIdAndDelete(id);

  if (!item) {
    return NextResponse.json({ status: "error", message: "FAQ item not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", message: "FAQ item deleted." });
}
