import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();

  if (!session.role.isFounderRole && !session.role.canManageUsers) {
    return forbiddenResponse("You do not have permission to delete media.");
  }

  const body = await request.json();
  const { publicId, resourceType } = body as { publicId?: string; resourceType?: string };

  if (!publicId) {
    return NextResponse.json({ status: "error", message: "publicId is required." }, { status: 400 });
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === "raw" ? "raw" : "image",
    });
    return NextResponse.json({ status: "ok", message: "File deleted." });
  } catch (error) {
    console.error("Failed to delete media:", error);
    return NextResponse.json({ status: "error", message: "Failed to delete file." }, { status: 500 });
  }
}
