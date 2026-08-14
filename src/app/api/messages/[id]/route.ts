import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Message from "@/models/Message";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  await connectToDatabase();
  const message = await Message.findById(id);

  if (!message) {
    return NextResponse.json({ status: "error", message: "Message not found." }, { status: 404 });
  }
  if (message.recipient.toString() !== session.user._id.toString()) {
    return forbiddenResponse("This message does not belong to you.");
  }

  message.isRead = true;
  await message.save();

  return NextResponse.json({ status: "ok", message: "Marked as read." });
}
