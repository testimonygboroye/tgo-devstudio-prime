import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";

export const dynamic = "force-dynamic";

function isFounder(session: Awaited<ReturnType<typeof getAuthenticatedSession>>) {
  return Boolean(session?.role?.isFounderRole);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!isFounder(session)) {
      return NextResponse.json({ error: "Founder access required." }, { status: 403 });
    }

    const body = await request.json();
    const subscription = body?.subscription;

    if (
      !subscription ||
      typeof subscription.endpoint !== "string" ||
      !subscription.endpoint.startsWith("https://") ||
      typeof subscription.keys?.p256dh !== "string" ||
      typeof subscription.keys?.auth !== "string"
    ) {
      return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
    }

    await connectToDatabase();

    const userId = String(session.user._id);
    const endpoint = subscription.endpoint;

    // An endpoint may be registered only to the currently authenticated founder.
    const existing = await PushSubscription.findOne({ endpoint }).lean();
    if (existing && String(existing.userId) !== userId) {
      return NextResponse.json(
        { error: "This device subscription is already registered to another account." },
        { status: 409 }
      );
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint, userId },
      {
        $set: {
          endpoint,
          userId: session.user._id,
          expirationTime: subscription.expirationTime ?? null,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
          deviceLabel:
            typeof body.deviceLabel === "string"
              ? body.deviceLabel.slice(0, 120)
              : "Browser device",
          userAgent: (request.headers.get("user-agent") || "").slice(0, 500),
          active: true,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ status: "ok", message: "This device is subscribed." });
  } catch (error) {
    console.error("[Push] Subscription registration failed:", error);
    return NextResponse.json({ error: "Could not save the subscription." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!isFounder(session)) {
      return NextResponse.json({ error: "Founder access required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (typeof body?.endpoint !== "string" || !body.endpoint.startsWith("https://")) {
      return NextResponse.json({ error: "A valid endpoint is required." }, { status: 400 });
    }

    await connectToDatabase();
    await PushSubscription.deleteOne({
      endpoint: body.endpoint,
      userId: session.user._id,
    });

    return NextResponse.json({ status: "ok", message: "This device was unsubscribed." });
  } catch (error) {
    console.error("[Push] Unsubscription failed:", error);
    return NextResponse.json({ error: "Could not remove the subscription." }, { status: 500 });
  }
}
