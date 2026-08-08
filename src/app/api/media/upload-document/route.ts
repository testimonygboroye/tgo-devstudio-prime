import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ status: "error", message: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { status: "error", message: "Only PDF and Word documents are allowed." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { status: "error", message: "File is too large. Maximum size is 5MB." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "tgo-devstudio-prime/resumes", resource_type: "raw" },
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
