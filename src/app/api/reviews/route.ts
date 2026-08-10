import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import Project from "@/models/Project";
import TeamMember from "@/models/TeamMember";
import BlogPost from "@/models/BlogPost";
import JobOpening from "@/models/JobOpening";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import { notifyNewReview } from "@/lib/email/notifyNewReview";
import { confirmReviewReceived } from "@/lib/email/confirmReviewReceived";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  REVIEW_TARGET_TYPES,
  REVIEW_TARGET_MODEL,
  REVIEW_TARGET_LABELS,
  targetRequiresId,
  targetRequiresCustomLabel,
  ReviewTargetType,
} from "@/lib/constants/reviewTargets";

const CONTENT_TYPE = "reviews";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 3;

async function findTargetLabel(
  resolvedTargetModel: string,
  targetId: string
): Promise<string | null> {
  switch (resolvedTargetModel) {
    case "Project": {
      const doc = await Project.findById(targetId).select("title");
      return doc ? doc.title : null;
    }
    case "TeamMember": {
      const doc = await TeamMember.findById(targetId).select("name");
      return doc ? doc.name : null;
    }
    case "BlogPost": {
      const doc = await BlogPost.findById(targetId).select("title");
      return doc ? doc.title : null;
    }
    case "JobOpening": {
      const doc = await JobOpening.findById(targetId).select("title");
      return doc ? doc.title : null;
    }
    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    submitterName,
    submitterEmail,
    rating,
    reviewBody,
    targetType,
    targetId,
    customLabel,
    companyWebsite,
    turnstileToken,
  } = body as {
    submitterName?: string;
    submitterEmail?: string;
    rating?: number;
    reviewBody?: string;
    targetType?: string;
    targetId?: string;
    customLabel?: string;
    companyWebsite?: string;
    turnstileToken?: string;
  };

  if (companyWebsite) {
    return NextResponse.json({ status: "ok", message: "Review received." });
  }

  if (!submitterName || !submitterEmail || !rating || !reviewBody || !targetType) {
    return NextResponse.json(
      { status: "error", message: "Name, email, rating, message, and topic are all required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
    return NextResponse.json({ status: "error", message: "Invalid email format." }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ status: "error", message: "Rating must be between 1 and 5." }, { status: 400 });
  }

  if (!REVIEW_TARGET_TYPES.includes(targetType as ReviewTargetType)) {
    return NextResponse.json({ status: "error", message: "Invalid review topic." }, { status: 400 });
  }

  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const isHuman = await verifyTurnstileToken(turnstileToken || "", remoteIp);
  if (!isHuman) {
    return NextResponse.json(
      { status: "error", message: "Verification failed. Please try again." },
      { status: 400 }
    );
  }

  const resolvedTargetType = targetType as ReviewTargetType;

  if (targetRequiresCustomLabel(resolvedTargetType) && !customLabel?.trim()) {
    return NextResponse.json(
      { status: "error", message: "Please describe what this review is about." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  let targetLabelSnapshot: string | undefined;
  let resolvedTargetModel: string | undefined;

  if (targetRequiresId(resolvedTargetType)) {
    if (!targetId) {
      return NextResponse.json(
        { status: "error", message: "Please select what this review is about." },
        { status: 400 }
      );
    }

    resolvedTargetModel = REVIEW_TARGET_MODEL[resolvedTargetType] || undefined;

    if (resolvedTargetModel === "Review") {
      const targetReview = await Review.findOne({ _id: targetId, status: "approved" }).select("submitterName body");
      if (!targetReview) {
        return NextResponse.json({ status: "error", message: "Selected review not found." }, { status: 404 });
      }
      targetLabelSnapshot = `${targetReview.submitterName}'s review`;
    } else if (resolvedTargetModel) {
      const label = await findTargetLabel(resolvedTargetModel, targetId);
      if (!label) {
        return NextResponse.json({ status: "error", message: "Selected item not found." }, { status: 404 });
      }
      targetLabelSnapshot = label;
    }
  } else {
    targetLabelSnapshot = REVIEW_TARGET_LABELS[resolvedTargetType];
  }

  const recentCount = await Review.countDocuments({
    createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
    submitterEmail: submitterEmail.toLowerCase(),
  });

  if (recentCount >= RATE_LIMIT_MAX_SUBMISSIONS) {
    return NextResponse.json(
      { status: "error", message: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  const review = await Review.create({
    submitterName: submitterName.trim(),
    submitterEmail: submitterEmail.toLowerCase(),
    rating,
    body: reviewBody.trim(),
    targetType: resolvedTargetType,
    targetId: targetRequiresId(resolvedTargetType) ? targetId : undefined,
    targetModel: resolvedTargetModel,
    targetLabelSnapshot,
    customLabel: targetRequiresCustomLabel(resolvedTargetType) ? customLabel!.trim() : undefined,
  });

  const finalLabel = targetRequiresCustomLabel(resolvedTargetType)
    ? review.customLabel!
    : targetLabelSnapshot || REVIEW_TARGET_LABELS[resolvedTargetType];

  notifyNewReview({
    submitterName: review.submitterName,
    rating: review.rating,
    targetLabel: finalLabel,
    reviewId: review._id.toString(),
  }).catch((err) => console.error("notifyNewReview failed:", err));

  confirmReviewReceived({
    submitterName: review.submitterName,
    submitterEmail: review.submitterEmail,
  }).catch((err) => console.error("confirmReviewReceived failed:", err));

  return NextResponse.json({ status: "ok", message: "Review received." }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "viewAnalytics")) {
    return forbiddenResponse("You do not have permission to view reviews.");
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();

  return NextResponse.json({ status: "ok", reviews });
}
