import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientActivity from "@/models/ClientActivity";
import User from "@/models/User";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!session.role.isFounderRole) return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  const { clientId } = await params;
  if (!Types.ObjectId.isValid(clientId)) return NextResponse.json({ error: "Invalid client id." }, { status: 400 });
  await connectToDatabase();
  const user = await User.findOne({ _id: clientId, accountType: "client" }).select("_id");
  if (!user) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  const items = await ClientActivity.find({ clientId }).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ activities: items.map(item => ({
    id: String(item._id), action: item.action, summary: item.summary,
    actorType: item.actorType, createdAt: item.createdAt.toISOString(),
  })) }, { headers: { "Cache-Control": "private, no-store" } });
}
