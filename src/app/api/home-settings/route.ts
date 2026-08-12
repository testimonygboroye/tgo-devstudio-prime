import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import HomeSettings from "@/models/HomeSettings";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import { HOME_DEFAULTS } from "@/lib/constants/pageDefaults";

const CONTENT_TYPE = "homeSettings";

const FIELDS = [
  "heroHeadline",
  "heroSubheadline",
  "primaryCtaLabel",
  "primaryCtaHref",
  "secondaryCtaLabel",
  "secondaryCtaHref",
  "caseStudiesLabel",
  "caseStudiesHeading",
  "servicesLabel",
  "servicesHeading",
  "processLabel",
  "processHeading",
  "teamLabel",
  "teamHeading",
  "testimonialsLabel",
  "testimonialsHeading",
  "blogLabel",
  "blogHeading",
  "careersLabel",
  "careersHeading",
  "careersNoRolesMessage",
  "finalCtaHeading",
  "finalCtaDescription",
  "finalCtaButtonLabel",
];

export async function GET() {
  await connectToDatabase();
  const saved = await HomeSettings.findOne().lean();

  if (saved) {
    const merged = { ...HOME_DEFAULTS, ...saved };
    return NextResponse.json({ status: "ok", settings: merged, isDefault: false });
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

  const update: Record<string, string> = {};
  for (const field of FIELDS) {
    if (typeof body[field] === "string") {
      update[field] = body[field].trim();
    }
  }

  const requiredFields = [
    "heroHeadline",
    "heroSubheadline",
    "primaryCtaLabel",
    "primaryCtaHref",
    "secondaryCtaLabel",
    "secondaryCtaHref",
  ];
  for (const field of requiredFields) {
    if (!update[field]) {
      return NextResponse.json({ status: "error", message: `${field} is required.` }, { status: 400 });
    }
  }

  await connectToDatabase();

  const settings = await HomeSettings.findOneAndUpdate(
    {},
    { ...update, lastUpdatedBy: session.user._id },
    { new: true, upsert: true }
  );

  return NextResponse.json({ status: "ok", settings });
}
