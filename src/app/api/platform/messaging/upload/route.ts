import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg", "audio/wav", "application/pdf", "text/plain"]);
export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (session.user.accountType !== "staff") return forbiddenResponse("Staff access is required.");
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "This file type is not supported for team chat." }, { status: 415 });
  if (file.size < 1 || file.size > MAX_BYTES) return NextResponse.json({ error: "Chat attachments must be 20 MB or smaller." }, { status: 413 });
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "tgo-devstudio-prime/communications", resource_type: "auto", use_filename: true, unique_filename: true }, (error, result) => {
        if (error || !result) return reject(error || new Error("Upload failed."));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      });
      stream.end(buffer);
    });
    return NextResponse.json({ status: "ok", attachment: { url: uploaded.secure_url, publicId: uploaded.public_id, name: file.name.slice(0, 180), mimeType: file.type, size: file.size } }, { status: 201 });
  } catch (error) {
    console.error("[Communications] Attachment upload failed:", error);
    return NextResponse.json({ error: "The attachment could not be uploaded. Check cloud media configuration." }, { status: 502 });
  }
}
