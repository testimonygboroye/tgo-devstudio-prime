import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "faqItems";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireContentPermission(session, CONTENT_TYPE, "create")) {
    return forbiddenResponse("You do not have permission to create FAQ items.");
  }

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

  const item = await FaqItem.create({
    question: question.trim(),
    answer: answer.trim(),
    category: category?.trim() || "General",
    displayOrder: displayOrder ?? 0,
    publishStatus: publishStatus === "published" ? "published" : "draft",
    createdBy: session.user._id,
  });

  return NextResponse.json({ status: "ok", item }, { status: 201 });
}
