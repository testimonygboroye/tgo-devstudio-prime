import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import PlatformNotification from "@/models/PlatformNotification";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) return NextResponse.json({ error: "Verified client sign-in required." }, { status: 401 });
  await connectToDatabase();
  const items = await PlatformNotification.find({ recipientId: session.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ notifications: items.map((item) => ({
    id: String(item._id), category: item.category, title: item.title, body: item.body,
    href: item.href || "", readAt: item.readAt?.toISOString() || null, createdAt: item.createdAt.toISOString(),
  })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client") return NextResponse.json({ error: "Client sign-in required." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  await connectToDatabase();
  if (body.markAllRead === true) {
    await PlatformNotification.updateMany({ recipientId: session.user._id, readAt: { $exists: false } }, { $set: { readAt: new Date() } });
  } else if (typeof body.id === "string") {
    await PlatformNotification.updateOne({ _id: body.id, recipientId: session.user._id }, { $set: { readAt: new Date() } });
  } else return NextResponse.json({ error: "A notification id or markAllRead is required." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
