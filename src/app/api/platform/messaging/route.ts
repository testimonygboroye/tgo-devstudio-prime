import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";
import { connectToDatabase } from "@/lib/db";
import { UnifiedConversation, UnifiedMessage } from "@/models/UnifiedConversation";
import User from "@/models/User";
import { AIAgent, AITask } from "@/models/AIWorkforce";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import { getVerifiedIntegrationCredentials } from "@/lib/integrations/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (message: string, status = 400) => NextResponse.json({ status: "error", message }, { status });
const validKinds = ["direct", "group", "channel", "ai"] as const;

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (conversationId) {
    if (!Types.ObjectId.isValid(conversationId)) return fail("Invalid conversation ID.");
    const conversation = await UnifiedConversation.findById(conversationId).populate("memberIds", "name email").populate("aiAgentId", "name role department").lean();
    if (!conversation) return fail("Conversation not found.", 404);
    const isMember = conversation.memberIds.some((member: unknown) => String((member as {_id?: unknown})._id || member) === String(session.user._id));
    if (!isMember && !session.role.isFounderRole) return forbiddenResponse("You are not a member of this conversation.");
    const messages = await UnifiedMessage.find({ conversationId }).sort({ createdAt: 1 }).limit(300).lean();
    return NextResponse.json({ status: "ok", conversation, messages }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const filter = session.role.isFounderRole ? { archivedAt: { $exists: false } } : { memberIds: session.user._id, archivedAt: { $exists: false } };
  const conversations = await UnifiedConversation.find(filter).populate("memberIds", "name email").populate("aiAgentId", "name role department").sort({ lastMessageAt: -1, updatedAt: -1 }).limit(150).lean();
  const people = session.role.isFounderRole ? await User.find({ isActive: { $ne: false } }).select("name email role").sort({ name: 1 }).limit(300).lean() : [];
  const agents = session.role.isFounderRole ? await AIAgent.find({ enabled: true }).select("name role department").sort({ name: 1 }).lean() : [];
  return NextResponse.json({ status: "ok", conversations, people, agents }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  await connectToDatabase();
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const actorId = session.user._id as Types.ObjectId;
  const actorName = String(session.user.name || session.user.email || "Team member").slice(0, 160);

  if (body.action === "create") {
    const kind = String(body.kind || "direct");
    if (!validKinds.includes(kind as typeof validKinds[number])) return fail("Unsupported conversation type.");
    if ((kind === "group" || kind === "channel" || kind === "ai") && !session.role.isFounderRole) return forbiddenResponse("Founder access is required to create groups, channels and AI conversations.");
    const ids = Array.isArray(body.memberIds) ? body.memberIds.filter((id): id is string => typeof id === "string" && Types.ObjectId.isValid(id)).slice(0, 100) : [];
    if (kind === "direct" && ids.length !== 1) return fail("A direct conversation requires exactly one other team member.");
    if (kind === "ai" && (!body.aiAgentId || !Types.ObjectId.isValid(String(body.aiAgentId)))) return fail("Select a valid AI employee.");
    const members = Array.from(new Set([String(actorId), ...ids]));
    if (kind === "ai") {
      const agent = await AIAgent.findOne({ _id: body.aiAgentId, enabled: true }).select("name");
      if (!agent) return fail("The selected AI employee is not enabled.", 404);
    }
    const conversation = await UnifiedConversation.create({
      kind, title: String(body.title || "").trim().slice(0, 160),
      createdBy: actorId, memberIds: members,
      aiAgentId: kind === "ai" ? body.aiAgentId : undefined,
    });
    await writePlatformAuditEvent({ actorType: "human", actorId: String(actorId), actorLabel: actorName, action: "communications.conversation.created", module: "communications", targetType: "UnifiedConversation", targetId: String(conversation._id), outcome: "success", metadata: { kind, memberCount: members.length } });
    return NextResponse.json({ status: "ok", conversationId: String(conversation._id) }, { status: 201 });
  }

  if (body.action === "send") {
    const conversationId = String(body.conversationId || "");
    const content = typeof body.body === "string" ? body.body.trim() : "";
    if (!Types.ObjectId.isValid(conversationId) || !content || content.length > 12000) return fail("A valid conversation and message (1–12,000 characters) are required.");
    const conversation = await UnifiedConversation.findById(conversationId);
    if (!conversation) return fail("Conversation not found.", 404);
    if (!conversation.memberIds.some((id) => String(id) === String(actorId)) && !session.role.isFounderRole) return forbiddenResponse("You are not a member of this conversation.");
    const message = await UnifiedMessage.create({ conversationId, senderType: "human", senderId: actorId, senderLabel: actorName, body: content, status: "sent", readBy: [actorId] });
    conversation.lastMessageAt = new Date();
    await conversation.save();

    if (conversation.kind === "whatsapp") {
      if (!conversation.externalOptInAt || !conversation.externalContactId || !conversation.externalLastInboundAt || Date.now() - conversation.externalLastInboundAt.getTime() > 24 * 60 * 60 * 1000) return fail("WhatsApp free-form replies are available only within 24 hours of the contact\u2019s latest inbound message. Outside that window, an approved WhatsApp template is required.", 409);
      const credentials = await getVerifiedIntegrationCredentials("whatsapp_cloud");
      const token = credentials?.accessToken;
      const phoneNumberId = credentials?.phoneNumberId;
      if (!token || !phoneNumberId) return fail("WhatsApp Cloud API credentials are not configured.", 503);
      try {
        const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
          method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: conversation.externalContactId, type: "text", text: { preview_url: false, body: content } }),
          signal: AbortSignal.timeout(15000), cache: "no-store",
        });
        const result = await response.json().catch(() => ({})) as { messages?: { id?: string }[]; error?: { message?: string } };
        if (!response.ok) throw new Error(result.error?.message || "WhatsApp delivery failed.");
        message.externalMessageId = result.messages?.[0]?.id;
        await message.save();
      } catch (error) {
        message.status = "failed"; await message.save();
        return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "WhatsApp delivery failed.", messageId: String(message._id) }, { status: 502 });
      }
    }
    return NextResponse.json({ status: "ok", message: { id: String(message._id), body: message.body, createdAt: message.createdAt, senderLabel: actorName, senderType: "human" } }, { status: 201 });
  }

  if (body.action === "ai.task") {
    if (!session.role.isFounderRole) return forbiddenResponse("Founder access is required to assign AI work.");
    const agentId = String(body.agentId || ""), input = String(body.input || "").trim();
    if (!Types.ObjectId.isValid(agentId) || input.length < 5 || input.length > 20000) return fail("Select an AI employee and provide a task description.");
    const agent = await AIAgent.findOne({ _id: agentId, enabled: true });
    if (!agent) return fail("AI employee is unavailable.", 404);
    const task = await AITask.create({ agentId, title: String(body.title || input.slice(0, 120)).slice(0, 180), input, status: agent.requiresApproval ? "awaiting_approval" : "queued", requestedBy: String(actorId), operationPayload: { source: "communications", conversationId: typeof body.conversationId === "string" ? body.conversationId : undefined } });
    await writePlatformAuditEvent({ actorType: "human", actorId: String(actorId), actorLabel: actorName, action: "ai.task.assigned_from_communications", module: "communications", targetType: "AITask", targetId: String(task._id), outcome: "success", metadata: { agentId, status: task.status } });
    return NextResponse.json({ status: "ok", taskId: String(task._id), taskStatus: task.status, message: "Task recorded in the AI workforce queue." }, { status: 201 });
  }
  return fail("Unsupported communications action.");
}
