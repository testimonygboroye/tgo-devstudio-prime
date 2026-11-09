import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientActivity from "@/models/ClientActivity";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) return NextResponse.json({ error: "Verified client sign-in required." }, { status: 401 });
  await connectToDatabase();
  const activities = await ClientActivity.find({ clientId: session.user._id }).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ activities: activities.map((item) => ({
    id: String(item._id), action: item.action, summary: item.summary, actorType: item.actorType,
    createdAt: item.createdAt.toISOString(),
  })) }, { headers: { "Cache-Control": "private, no-store" } });
}
