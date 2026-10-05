import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import AvailabilityStatus from "@/models/AvailabilityStatus";
import { getAuthenticatedSession } from "@/lib/auth/session";
import {
  unauthorizedResponse,
  forbiddenResponse,
  requireContentPermission,
} from "@/lib/auth/authorize";
import { AVAILABILITY_DEFAULT } from "@/lib/constants/pageDefaults";

const CONTENT_TYPE = "availabilityStatus";

export async function GET() {
  await connectToDatabase();

  const saved = await AvailabilityStatus.findOne().lean();

  if (saved) {
    return NextResponse.json({
      status: "ok",
      availability: saved,
      isDefault: false,
    });
  }

  return NextResponse.json({
    status: "ok",
    availability: AVAILABILITY_DEFAULT,
    isDefault: true,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getAuthenticatedSession(request);

  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireContentPermission(session, CONTENT_TYPE, "edit")) {
    return forbiddenResponse(
      "You do not have permission to edit availability status."
    );
  }

  const body = await request.json();

  const {
    state,
    customMessage,
  } = body as {
    state?: string;
    customMessage?: string;
  };

  if (
    !state ||
    !["accepting", "limited", "booked"].includes(state)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid state.",
      },
      { status: 400 }
    );
  }

  const normalizedCustomMessage =
    typeof customMessage === "string"
      ? customMessage.trim()
      : "";

  if (normalizedCustomMessage.length > 150) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Custom message must be 150 characters or fewer.",
      },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const update: Record<string, unknown> = {
    $set: {
      state,
      lastUpdatedBy: session.user._id,
    },
  };

  if (normalizedCustomMessage) {
    (update.$set as Record<string, unknown>).customMessage =
      normalizedCustomMessage;
  } else {
    update.$unset = {
      customMessage: 1,
    };
  }

  const availability =
    await AvailabilityStatus.findOneAndUpdate(
      {},
      update,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

  return NextResponse.json({
    status: "ok",
    availability,
  });
}
