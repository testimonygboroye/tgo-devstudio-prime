import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";
import cloudinary from "@/lib/cloudinary";

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
  created_at: string;
  folder?: string;
}

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();

  if (!session.role.isFounderRole && !session.role.canManageUsers) {
    return forbiddenResponse("You do not have permission to view the media library.");
  }

  try {
    const [imagesResult, rawResult] = await Promise.all([
      cloudinary.api.resources({
        type: "upload",
        resource_type: "image",
        prefix: "tgo-devstudio-prime/",
        max_results: 200,
      }),
      cloudinary.api.resources({
        type: "upload",
        resource_type: "raw",
        prefix: "tgo-devstudio-prime/",
        max_results: 200,
      }),
    ]);

    const allResources: CloudinaryResource[] = [
      ...imagesResult.resources,
      ...rawResult.resources,
    ];

    allResources.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const items = allResources.map((resource) => {
      const parts = resource.public_id.split("/");
      const folder = parts.length > 2 ? parts[1] : "root";

      return {
        publicId: resource.public_id,
        url: resource.secure_url,
        resourceType: resource.resource_type,
        format: resource.format,
        bytes: resource.bytes,
        createdAt: resource.created_at,
        folder,
      };
    });

    return NextResponse.json({ status: "ok", items });
  } catch (error) {
    console.error("Failed to fetch media library:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to load media library from Cloudinary." },
      { status: 500 }
    );
  }
}
