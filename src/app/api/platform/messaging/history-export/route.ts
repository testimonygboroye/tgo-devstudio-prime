import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";
import { connectToDatabase } from "@/lib/db";
import { UnifiedConversation, UnifiedMessage } from "@/models/UnifiedConversation";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (session.user.accountType !== "staff") return forbiddenResponse("Staff access is required.");

  const params = request.nextUrl.searchParams;
  const conversationId = params.get("conversationId") || "";
  const allTime = params.get("allTime") === "true";
  const fromValue = params.get("from") || "";
  const toValue = params.get("to") || "";
  if (!Types.ObjectId.isValid(conversationId)) return NextResponse.json({ error: "A valid conversation is required." }, { status: 400 });
  if (!allTime && (!fromValue || !toValue || !Number.isFinite(Date.parse(fromValue)) || !Number.isFinite(Date.parse(toValue)))) {
    return NextResponse.json({ error: "Choose a valid start and end date, or select all time." }, { status: 400 });
  }
  const from = allTime ? undefined : new Date(fromValue);
  const to = allTime ? undefined : new Date(toValue);
  if (from && to && (from > to || to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "The date range is invalid or exceeds 366 days. Use all time for a full archive." }, { status: 400 });
  }

  await connectToDatabase();
  const conversation = await UnifiedConversation.findById(conversationId).populate("memberIds", "name email").populate("aiAgentId", "name role").lean();
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  const isMember = conversation.memberIds.some((member: unknown) => String((member as { _id?: unknown })._id || member) === String(session.user._id));
  if (!isMember) return forbiddenResponse("You cannot export a private conversation you do not belong to.");

  const filter: Record<string, unknown> = { conversationId };
  if (from || to) filter.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1) } : {}) };
  const messages = await UnifiedMessage.find(filter).sort({ createdAt: 1 }).limit(20000).lean();
  await writePlatformAuditEvent({ actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name, action: "communications.history_exported", module: "communications", targetType: "UnifiedConversation", targetId: conversationId, outcome: "success", metadata: { messageCount: messages.length, allTime, from: from?.toISOString() || "", to: to?.toISOString() || "" } });
  const payload = {
    format: "tgo-communications-archive",
    version: 1,
    exportedAt: new Date().toISOString(),
    range: allTime ? { allTime: true } : { allTime: false, from: from?.toISOString(), to: to?.toISOString() },
    conversation: {
      id: String(conversation._id),
      kind: conversation.kind,
      title: conversation.title,
      members: conversation.memberIds.map((member: unknown) => {
        const item = member as { _id?: unknown; name?: string; email?: string };
        return { id: String(item._id || ""), name: item.name || "", email: item.email || "" };
      }),
      aiAgent: conversation.aiAgentId || null,
    },
    totalMessages: messages.length,
    truncated: messages.length === 20000,
    messages: messages.map((message) => ({
      id: String(message._id),
      senderType: message.senderType,
      senderLabel: message.senderLabel,
      body: message.body,
      messageType: message.messageType,
      attachments: message.attachments || [],
      createdAt: message.createdAt,
      editedAt: message.editedAt || null,
      deletedAt: message.deletedAt || null,
      threadRootId: message.threadRootId ? String(message.threadRootId) : null,
      reactions: (message.reactions || []).map((reaction) => ({ emoji: reaction.emoji, userId: String(reaction.userId) })),
    })),
  };
  const safeTitle = String(conversation.title || conversation.kind || "conversation").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "conversation";
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tgo-' + safeTitle + '-history.json"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
