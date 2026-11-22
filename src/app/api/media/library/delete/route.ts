import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";
import { connectToDatabase } from "@/lib/db";
import MediaCollection from "@/models/MediaCollection";
import cloudinary from "@/lib/cloudinary";
export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.role.isFounderRole && !session.role.canManageUsers) return forbiddenResponse("You do not have permission to delete media.");
  let body: { publicId?: string; resourceType?: string };
  try { body = await request.json(); } catch { return NextResponse.json({status:"error",message:"Invalid request body."},{status:400}); }
  const { publicId, resourceType } = body;
  if (!publicId || publicId.length > 500 || !publicId.startsWith("tgo-devstudio-prime/")) return NextResponse.json({status:"error",message:"A valid TGO Cloudinary publicId is required."},{status:400});
  const safeResourceType = resourceType === "video" ? "video" : resourceType === "raw" ? "raw" : "image";
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: safeResourceType, invalidate: true });
    if (result.result !== "ok" && result.result !== "not found") throw new Error("Cloudinary did not confirm deletion.");
    await connectToDatabase();
    await MediaCollection.updateMany({}, {$pull:{items:{publicId}}});
    return NextResponse.json({status:"ok",message:"Stored media deleted and all collection references removed.",cloudinary:result.result});
  } catch (error) {
    console.error("Failed to delete media:", error);
    return NextResponse.json({status:"error",message:"The stored file could not be confirmed deleted. The media reference was retained."},{status:500});
  }
}
