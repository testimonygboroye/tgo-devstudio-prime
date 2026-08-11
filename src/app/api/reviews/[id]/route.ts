import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";

const CONTENT_TYPE = "reviews";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "viewAnalytics")) {
    return forbiddenResponse("You do not have permission to view reviews.");
  }

  const { id } = await params;
  await connectToDatabase();
  const review = await Review.findById(id).lean();

  if (!review) {
    return NextResponse.json({ status: "error", message: "Review not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", review });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse("You do not have permission to moderate reviews.");
  }

  const { id } = await params;
  const body = await request.json();
  const { action, editedBody, featured, featuredOnHomepage, note } = body as {
    action?: "approve" | "reject" | "edit" | "setFeatured" | "setFeaturedOnHomepage";
    editedBody?: string;
    featured?: boolean;
    featuredOnHomepage?: boolean;
    note?: string;
  };

  await connectToDatabase();
  const review = await Review.findById(id);

  if (!review) {
    return NextResponse.json({ status: "error", message: "Review not found." }, { status: 404 });
  }

  const performedByName = session.user.name;

  if (action === "approve") {
    review.status = "approved";
    review.moderationHistory.push({ action: "approved", performedByName, timestamp: new Date(), note });
  } else if (action === "reject") {
    review.status = "rejected";
    review.moderationHistory.push({ action: "rejected", performedByName, timestamp: new Date(), note });
  } else if (action === "edit") {
    if (!editedBody || !editedBody.trim()) {
      return NextResponse.json({ status: "error", message: "Edited text cannot be empty." }, { status: 400 });
    }
    review.body = editedBody.trim();
    review.status = "approved";
    review.moderationHistory.push({
      action: "edited",
      performedByName,
      timestamp: new Date(),
      note: note || "Edited and approved.",
    });
  } else if (action === "setFeatured") {
    if (review.status !== "approved") {
      return NextResponse.json(
        { status: "error", message: "Only approved reviews can be featured." },
        { status: 400 }
      );
    }
    review.featured = featured === true;
  } else if (action === "setFeaturedOnHomepage") {
    if (review.status !== "approved") {
      return NextResponse.json(
        { status: "error", message: "Only approved reviews can be featured on the homepage." },
        { status: 400 }
      );
    }
    review.featuredOnHomepage = featuredOnHomepage === true;
  } else {
    return NextResponse.json({ status: "error", message: "Invalid action." }, { status: 400 });
  }

  await review.save();

  return NextResponse.json({ status: "ok", review });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "delete")) {
    return forbiddenResponse("You do not have permission to delete reviews.");
  }

  const { id } = await params;
  await connectToDatabase();
  const review = await Review.findByIdAndDelete(id);

  if (!review) {
    return NextResponse.json({ status: "error", message: "Review not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", message: "Review deleted." });
}
