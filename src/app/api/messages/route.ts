import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Message from "@/models/Message";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse } from "@/lib/auth/authorize";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();

  await connectToDatabase();
  const messages = await Message.find({ recipient: session.user._id }).sort({ createdAt: -1 }).lean();

  return NextResponse.json({ status: "ok", messages });
}
