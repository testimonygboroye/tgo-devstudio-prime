import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import LegalDocument, { LegalDocumentType } from "@/models/LegalDocument";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";

const CONTENT_TYPE = "legalDocuments";
const VALID_TYPES: LegalDocumentType[] = ["privacy-policy", "terms-of-service"];

interface RouteParams {
  params: Promise<{ type: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { type } = await params;

  if (!VALID_TYPES.includes(type as LegalDocumentType)) {
    return NextResponse.json({ status: "error", message: "Invalid document type." }, { status: 400 });
  }

  await connectToDatabase();
  const document = await LegalDocument.findOne({ type }).lean();

  if (!document) {
    return NextResponse.json({ status: "ok", document: null });
  }

  return NextResponse.json({ status: "ok", document });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit legal documents.");
  }

  const { type } = await params;

  if (!VALID_TYPES.includes(type as LegalDocumentType)) {
    return NextResponse.json({ status: "error", message: "Invalid document type." }, { status: 400 });
  }

  const body = await request.json();
  const { title, content } = body as { title?: string; content?: string };

  if (!title || !content) {
    return NextResponse.json({ status: "error", message: "Title and content are required." }, { status: 400 });
  }

  await connectToDatabase();

  const sanitizedContent = sanitizeBlogHtml(content);

  const document = await LegalDocument.findOneAndUpdate(
    { type },
    {
      type,
      title: title.trim(),
      content: sanitizedContent,
      lastUpdatedBy: session.user._id,
    },
    { new: true, upsert: true }
  );

  return NextResponse.json({ status: "ok", document });
}
