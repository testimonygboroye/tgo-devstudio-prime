import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireAnyContentPermission } from "@/lib/auth/authorize";
import cloudinary from "@/lib/cloudinary";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ALLOWED_FOLDERS = [
  "case-studies",
  "team",
  "about",
  "blog",
  "job-applications",
] as const;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const requestedFolder = formData.get("folder");

  const folder =
    typeof requestedFolder === "string" && ALLOWED_FOLDERS.includes(requestedFolder as (typeof ALLOWED_FOLDERS)[number])
      ? requestedFolder
      : "case-studies";

  // Job application photos are submitted by unauthenticated public applicants — every other
  // folder requires an authenticated admin session with content permission.
  if (folder !== "job-applications") {
    const session = await getAuthenticatedSession(request);
    if (!session) {
      return unauthorizedResponse();
    }
    if (!requireAnyContentPermission(session, "caseStudies")) {
      return forbiddenResponse("You do not have permission to upload media.");
    }
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ status: "error", message: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { status: "error", message: "Only JPEG, PNG, and WebP images are allowed." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { status: "error", message: "File is too large. Maximum size is 8MB." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `tgo-devstudio-prime/${folder}` },
        (error, result) => {
          if (error || !result) {
            reject(error);
            return;
          }
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
      uploadStream.end(buffer);
    }
  );

  return NextResponse.json({
    status: "ok",
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  });
}
