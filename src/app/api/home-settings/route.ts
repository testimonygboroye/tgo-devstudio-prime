import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import HomeSettings from "@/models/HomeSettings";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import { HOME_DEFAULTS } from "@/lib/constants/pageDefaults";

const CONTENT_TYPE = "homeSettings";

export async function GET() {
  await connectToDatabase();
  const saved = await HomeSettings.findOne().lean();

  if (saved) {
    return NextResponse.json({ status: "ok", settings: saved, isDefault: false });
  }

  return NextResponse.json({ status: "ok", settings: HOME_DEFAULTS, isDefault: true });
}

export async function PUT(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit homepage settings.");
  }

  const body = await request.json();
  const {
    heroHeadline,
    heroSubheadline,
    primaryCtaLabel,
    primaryCtaHref,
    secondaryCtaLabel,
    secondaryCtaHref,
  } = body as Record<string, string>;

  if (
    !heroHeadline ||
    !heroSubheadline ||
    !primaryCtaLabel ||
    !primaryCtaHref ||
    !secondaryCtaLabel ||
    !secondaryCtaHref
  ) {
    return NextResponse.json({ status: "error", message: "All fields are required." }, { status: 400 });
  }

  await connectToDatabase();

  const settings = await HomeSettings.findOneAndUpdate(
    {},
    {
      heroHeadline: heroHeadline.trim(),
      heroSubheadline: heroSubheadline.trim(),
      primaryCtaLabel: primaryCtaLabel.trim(),
      primaryCtaHref: primaryCtaHref.trim(),
      secondaryCtaLabel: secondaryCtaLabel.trim(),
      secondaryCtaHref: secondaryCtaHref.trim(),
      lastUpdatedBy: session.user._id,
    },
    { new: true, upsert: true }
  );

  return NextResponse.json({ status: "ok", settings });
}
