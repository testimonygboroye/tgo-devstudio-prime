import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { getAuthenticatedSession } from "@/lib/auth/session";
import {
  unauthorizedResponse,
  forbiddenResponse,
  requireContentPermission,
} from "@/lib/auth/authorize";

const CONTENT_TYPE = "services";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await getAuthenticatedSession(request);

  if (!session) return unauthorizedResponse();

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to edit services.");
  }

  const { id } = await params;
  const body = await request.json();

  const {
    title,
    summary,
    icon,
    displayOrder,
    publishStatus,
    featured,
    coverImage,
  } = body as {
    title?: string;
    summary?: string;
    icon?: string;
    displayOrder?: number;
    publishStatus?: string;
    featured?: boolean;
    coverImage?: { url?: string; publicId?: string; altText?: string } | null;
  };

  if (!title?.trim() || !summary?.trim()) {
    return NextResponse.json(
      { status: "error", message: "Title and summary are required." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const update: Record<string, unknown> = {
    title: title.trim(),
    summary: summary.trim(),
    icon: icon || "Code",
    displayOrder: displayOrder ?? 0,
    publishStatus: publishStatus === "published" ? "published" : "draft",
    featured: featured === true,
  };

  // Only change the cover image when the caller explicitly includes it.
  if (Object.prototype.hasOwnProperty.call(body, "coverImage")) {
    update.coverImage = coverImage?.url
      ? {
          url: coverImage.url,
          publicId: coverImage.publicId || "",
          altText: coverImage.altText || title.trim(),
        }
      : undefined;
  }

  const service = await Service.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!service) {
    return NextResponse.json(
      { status: "error", message: "Service not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ status: "ok", service });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await getAuthenticatedSession(request);

  if (!session) return unauthorizedResponse();

  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete services.");
  }

  const { id } = await params;

  await connectToDatabase();

  const service = await Service.findByIdAndDelete(id);

  if (!service) {
    return NextResponse.json(
      { status: "error", message: "Service not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "ok",
    message: "Service deleted.",
  });
}
