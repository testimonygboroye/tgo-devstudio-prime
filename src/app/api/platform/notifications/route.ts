import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import PlatformNotification from "@/models/PlatformNotification";
import PlatformAuditEvent from "@/models/PlatformAuditEvent";

export const dynamic = "force-dynamic";

async function founderSession() {
  const session = await getServerSession();
  if (!session) return { session: null, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (!session.role?.isFounderRole) return { session: null, response: NextResponse.json({ error: "Founder access required." }, { status: 403 }) };
  return { session, response: null };
}

export async function GET(request: NextRequest) {
  const auth = await founderSession();
  if (auth.response) return auth.response;
  if (!auth.session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  await connectToDatabase();
  const limitValue = Number(request.nextUrl.searchParams.get("limit") || 20);
  const limit = Number.isFinite(limitValue) ? Math.min(50, Math.max(1, Math.floor(limitValue))) : 20;
  const notifications = await PlatformNotification.find({ recipientId: auth.session.user._id })
    .sort({ createdAt: -1 }).limit(limit)
    .select("category title body href readAt createdAt").lean();
  const unreadCount = await PlatformNotification.countDocuments({ recipientId: auth.session.user._id, readAt: { $exists: false } });
  const response = NextResponse.json({
    notifications: notifications.map((item) => ({
      id: String(item._id), category: item.category, title: item.title, body: item.body,
      href: item.href || null, readAt: item.readAt?.toISOString() || null, createdAt: item.createdAt.toISOString(),
    })),
    unreadCount,
  });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function PATCH(request: NextRequest) {
  const auth = await founderSession();
  if (auth.response || !auth.session) return auth.response;
  let body: { id?: unknown; markAllRead?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  await connectToDatabase();
  const filter = { recipientId: auth.session.user._id, readAt: { $exists: false } };
  let modifiedCount = 0;
  if (body.markAllRead === true) {
    const result = await PlatformNotification.updateMany(filter, { $set: { readAt: new Date() } });
    modifiedCount = result.modifiedCount;
  } else if (typeof body.id === "string" && Types.ObjectId.isValid(body.id)) {
    const result = await PlatformNotification.updateOne({ _id: body.id, ...filter }, { $set: { readAt: new Date() } });
    modifiedCount = result.modifiedCount;
  } else {
    return NextResponse.json({ error: "Provide a notification id or markAllRead: true." }, { status: 400 });
  }
  if (modifiedCount > 0) {
    await PlatformAuditEvent.create({
      actorType: "human", actorId: String(auth.session.user._id), actorLabel: auth.session.user.name,
      action: body.markAllRead === true ? "notifications.mark_all_read" : "notification.mark_read",
      module: "notifications", outcome: "success", metadata: { count: modifiedCount },
    });
  }
  return NextResponse.json({ success: true, modifiedCount });
}
