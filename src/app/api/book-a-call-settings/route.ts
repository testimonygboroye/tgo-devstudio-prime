import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import BookACallSettings from "@/models/BookACallSettings";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "bookACallSettings";

const DEFAULTS = {
  heading: "Book a Discovery Call",
  description: "Pick a time that works for you, and let's talk about what you're building.",
  calendlyUrl: "https://calendly.com/testimonygboroye-dev/30min",
};

export async function GET() {
  await connectToDatabase();
  const saved = await BookACallSettings.findOne().lean();

  if (saved) {
    return NextResponse.json({ status: "ok", settings: { ...DEFAULTS, ...saved }, isDefault: false });
  }

  return NextResponse.json({ status: "ok", settings: DEFAULTS, isDefault: true });
}

export async function PUT(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit this page.");
  }

  const body = await request.json();
  const { heading, description, calendlyUrl } = body as {
    heading?: string;
    description?: string;
    calendlyUrl?: string;
  };

  if (!heading || !description || !calendlyUrl) {
    return NextResponse.json({ status: "error", message: "All fields are required." }, { status: 400 });
  }

  await connectToDatabase();

  const settings = await BookACallSettings.findOneAndUpdate(
    {},
    { heading: heading.trim(), description: description.trim(), calendlyUrl: calendlyUrl.trim(), lastUpdatedBy: session.user._id },
    { new: true, upsert: true }
  );

  return NextResponse.json({ status: "ok", settings });
}
