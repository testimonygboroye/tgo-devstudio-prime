import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { verifyUnsubscribeToken } from "@/lib/newsletter/unsubscribeToken";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || "";

  if (!verifyUnsubscribeToken(id, token)) {
    return NextResponse.json({ status: "error", message: "Invalid unsubscribe link." }, { status: 403 });
  }

  await connectToDatabase();
  const subscriber = await NewsletterSubscriber.findById(id);

  if (!subscriber) {
    return NextResponse.json({ status: "error", message: "Subscriber not found." }, { status: 404 });
  }

  subscriber.status = "unsubscribed";
  await subscriber.save();

  return NextResponse.json({ status: "ok", message: "You've been unsubscribed." });
}
