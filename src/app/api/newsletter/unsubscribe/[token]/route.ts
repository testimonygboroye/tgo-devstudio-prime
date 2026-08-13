import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { hashToken } from "@/lib/auth/tokens";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  await connectToDatabase();

  const tokenHash = hashToken(token);
  const subscriber = await NewsletterSubscriber.findOne({ unsubscribeTokenHash: tokenHash });

  if (!subscriber) {
    return NextResponse.json({ status: "error", message: "Invalid unsubscribe link." }, { status: 404 });
  }

  subscriber.status = "unsubscribed";
  await subscriber.save();

  return NextResponse.json({ status: "ok", message: "You've been unsubscribed." });
}
