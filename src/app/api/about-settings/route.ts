import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import AboutSettings from "@/models/AboutSettings";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "pageContent";

const DEFAULTS = {
  founderName: "Testimony Oluwatimilehin Gboroye",
  founderRole: "Founder, TGO DevStudio",
  founderDescription:
    "Building TGO DevStudio Prime from the ground up as the studio's flagship proof of standard — the same care given to every project the studio takes on.",
  founderPhotoUrl: "/founder.png",
  founderPhotoPublicId: "",
};

export async function GET() {
  await connectToDatabase();
  const saved = await AboutSettings.findOne().lean();

  if (saved) {
    return NextResponse.json({ status: "ok", settings: saved, isDefault: false });
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
  const { founderName, founderRole, founderDescription, founderPhotoUrl, founderPhotoPublicId } = body as {
    founderName?: string;
    founderRole?: string;
    founderDescription?: string;
    founderPhotoUrl?: string;
    founderPhotoPublicId?: string;
  };

  if (!founderName || !founderRole || !founderDescription || !founderPhotoUrl) {
    return NextResponse.json({ status: "error", message: "All fields are required." }, { status: 400 });
  }

  await connectToDatabase();

  const settings = await AboutSettings.findOneAndUpdate(
    {},
    {
      founderName: founderName.trim(),
      founderRole: founderRole.trim(),
      founderDescription: founderDescription.trim(),
      founderPhotoUrl,
      founderPhotoPublicId: founderPhotoPublicId || "",
      lastUpdatedBy: session.user._id,
    },
    { new: true, upsert: true }
  );

  return NextResponse.json({ status: "ok", settings });
}
