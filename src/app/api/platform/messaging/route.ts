import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";
import { connectToDatabase } from "@/lib/db";
import { UnifiedConversation, UnifiedMessage } from "@/models/UnifiedConversation";
import User from "@/models/User";
import { AIAgent, AITask } from "@/models/AIWorkforce";
import { runProviderCompletion } from "@/lib/ai/provider-runtime";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import { getVerifiedIntegrationCredentials } from "@/lib/integrations/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (message: string, status = 400) => NextResponse.json({ status: "error", message }, { status });
const validKinds = ["direct", "group", "channel", "ai"] as const;

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (session.user.accountType !== "staff") return forbiddenResponse("Staff access is required.");
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (conversationId) {
    if (!Types.ObjectId.isValid(conversationId)) return fail("Invalid conversation ID.");
    const conversation = await UnifiedConversation.findById(conversationId).populate("memberIds", "name email").populate("aiAgentId", "name role department").lean();
    if (!conversation) return fail("Conversation not found.", 404);
    const isMember = conversation.memberIds.some((member: unknown) => String((member as {_id?: unknown})._id || member) === String(session.user._id));
    if (!isMember && !session.role.isFounderRole) return forbiddenResponse("You are not a member of this conversation.");
    await UnifiedMessage.updateMany({ conversationId, senderId: { $ne: session.user._id }, readBy: { $ne: session.user._id } }, { $addToSet: { readBy: session.user._id }, $set: { status: "read" } });
    const query = searchParams.get("q")?.trim().slice(0, 100) || "";
    const messageFilter: Record<string, unknown> = { conversationId };
    if (query) messageFilter.body = { $regex: query.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\    const messages = await UnifiedMessage.find({ conversationId }).sort({ createdAt: 1 }).limit(300).lean();
    return NextResponse.json({ status: "ok", conversation, messages }"), $options: "i" };
    const messages = await UnifiedMessage.find(messageFilter).sort({ createdAt: 1 }).limit(300).lean();
    return NextResponse.json({ status: "ok", conversation, messages, isFounder: session.role.isFounderRole }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const filter = session.role.isFounderRole ? { archivedAt: { $exists: false } } : { memberIds: session.user._id, archivedAt: { $exists: false } };
  const conversations = await UnifiedConversation.find(filter).populate("memberIds", "name email").populate("aiAgentId", "name role department").sort({ lastMessageAt: -1, updatedAt: -1 }).limit(150).lean();
  const people = await User.find({ accountType: "staff", isBanned: { $ne: true } }).select("name email role").sort({ name: 1 }).limit(300).lean();
  const agents = session.role.isFounderRole ? await AIAgent.find({ enabled: true }).select("name role department").sort({ name: 1 }).lean() : [];
  return NextResponse.json({ status: "ok", conversations, people, agents }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (session.user.accountType !== "staff") return forbiddenResponse("Staff access is required.");
  await connectToDatabase();
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const actorId = session.user._id as Types.ObjectId;
  const actorName = String(session.user.name || session.user.email || "Team member").slice(0, 160);

  if (body.action === "create") {
    const requestedKind = String(body.kind || "direct");
    if (!validKinds.includes(requestedKind as typeof validKinds[number])) return fail("Unsupported conversation type.");
    const kind = requestedKind as typeof validKinds[number];
    if (kind === "ai" && !session.role.isFounderRole) return forbiddenResponse("Founder access is required to create AI conversations.");
    const ids = Array.isArray(body.memberIds) ? body.memberIds.filter((id): id is string => typeof id === "string" && Types.ObjectId.isValid(id)).slice(0, 100) : [];
    if (kind === "direct" && ids.length !== 1) return fail("A direct conversation requires exactly one other team member.");
    if (kind === "ai" && (!body.aiAgentId || !Types.ObjectId.isValid(String(body.aiAgentId)))) return fail("Select a valid AI employee.");
    if (ids.length) { const validStaff = await User.countDocuments({ _id: { $in: ids }, accountType: "staff", isBanned: { $ne: true } }); if (validStaff !== ids.length) return fail("One or more selected members are not active staff accounts."); }
    const members = Array.from(new Set([String(actorId), ...ids])).map((id) => new Types.ObjectId(id));
    const aiAgentId = String(body.aiAgentId || "");
    if (kind === "ai") {
      const agent = await AIAgent.findOne({ _id: aiAgentId, enabled: true }).select("name");
      if (!agent) return fail("The selected AI employee is not enabled.", 404);
    }
    const conversation = await UnifiedConversation.create({
      kind, title: String(body.title || "").trim().slice(0, 160),
      createdBy: actorId, memberIds: members,
      aiAgentId: kind === "ai" ? new Types.ObjectId(aiAgentId) : undefined,
    });
    await writePlatformAuditEvent({ actorType: "human", actorId: String(actorId), actorLabel: actorName, action: "communications.conversation.created", module: "communications", targetType: "UnifiedConversation", targetId: String(conversation._id), outcome: "success", metadata: { kind, memberCount: members.length } });
    return NextResponse.json({ status: "ok", conversationId: String(conversation._id) }, { status: 201 });
  }

  if (body.action === "send") {
    const conversationId = String(body.conversationId || "");
    const content = typeof body.body === "string" ? body.body.trim() : "";
    const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 5).filter((item): item is { name: string; url: string; mimeType: string; size: number } => Boolean(item && typeof item === "object" && typeof item.url === "string" && item.url.startsWith("https://res.cloudinary.com/") && typeof item.name === "string" && typeof item.mimeType === "string" && Number(item.size) > 0 && Number(item.size) <= 20971520)) : [];
    if (!Types.ObjectId.isValid(conversationId) || (!content && !attachments.length) || content.length > 12000) return fail("A valid conversation and text or attachment are required.");
    const conversation = await UnifiedConversation.findById(conversationId);
    if (!conversation) return fail("Conversation not found.", 404);
    if (!conversation.memberIds.some((id) => String(id) === String(actorId)) && !session.role.isFounderRole) return forbiddenResponse("You are not a member of this conversation.");
    let threadRootId: Types.ObjectId | undefined;
    if (typeof body.threadRootId === "string" && Types.ObjectId.isValid(body.threadRootId)) {
      const root = await UnifiedMessage.findOne({ _id: body.threadRootId, conversationId });
      if (!root) return fail("Thread root message does not belong to this conversation.");
      threadRootId = root.threadRootId || root._id;
    }
    if (conversation.kind === "whatsapp" && attachments.length) return fail("WhatsApp media sending is not enabled yet; send text within the customer service window.", 409);
    let whatsappCredentials: Record<string, string> | null = null;
    if (conversation.kind === "whatsapp") {
      if (!conversation.externalOptInAt || !conversation.externalContactId || !conversation.externalLastInboundAt || Date.now() - conversation.externalLastInboundAt.getTime() > 24 * 60 * 60 * 1000) return fail("WhatsApp free-form replies are available only within 24 hours of the contact’s latest inbound message. Outside that window, an approved WhatsApp template is required.", 409);
      whatsappCredentials = await getVerifiedIntegrationCredentials("whatsapp_cloud");
      if (!whatsappCredentials?.accessToken || !whatsappCredentials.phoneNumberId) return fail("WhatsApp Cloud API credentials are not configured and verified.", 503);
    }
    const message = await UnifiedMessage.create({ conversationId, senderType: "human", senderId: actorId, senderLabel: actorName, body: content, status: "sent", readBy: [actorId], threadRootId, attachments, messageType: attachments.some((item) => item.mimeType.startsWith("audio/")) ? "audio" : attachments.length ? "file" : "text" });
    conversation.lastMessageAt = new Date();
    await conversation.save();

    if (conversation.kind === "ai" && conversation.aiAgentId) {
      const agent = await AIAgent.findOne({ _id: conversation.aiAgentId, enabled: true });
      if (!agent) return fail("The assigned AI employee is currently unavailable.", 409);
      const task = await AITask.create({ agentId: agent._id, title: "Conversation with " + actorName, input: content, requestedBy: String(actorId), status: agent.requiresApproval ? "awaiting_approval" : "queued", operationPayload: { source: "ai_conversation", conversationId } });
      if (agent.requiresApproval) {
        await UnifiedMessage.create({ conversationId, senderType: "system", senderLabel: "TGO system", body: "Your message has been saved. This AI employee requires approval before responding. Task " + String(task._id) + " is awaiting approval." });
        return NextResponse.json({ status: "ok", message: { id: String(message._id), body: message.body, createdAt: message.createdAt, senderLabel: actorName, senderType: "human" }, taskStatus: "awaiting_approval" }, { status: 201 });
      }
      const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
      const usage = await AITask.aggregate([{ $match: { agentId: agent._id, status: { $in: ["completed", "running"] }, createdAt: { $gte: dayStart } } }, { $group: { _id: null, tokens: { $sum: { $add: ["$inputTokens", "$outputTokens"] } } } }]);
      if (Number(usage[0]?.tokens || 0) >= agent.maxDailyTokens) {
        task.status = "awaiting_approval"; task.error = "Daily token budget reached; founder review required."; await task.save();
        await UnifiedMessage.create({ conversationId, senderType: "system", senderLabel: "TGO system", body: "The AI employee reached its configured daily token budget. This task is waiting for founder review." });
        return NextResponse.json({ status: "ok", taskStatus: "awaiting_approval", message: "Daily AI budget reached; task queued for review." }, { status: 201 });
      }
      task.status = "running"; task.startedAt = new Date(); task.executionAttempts += 1; await task.save();
      try {
        const history = await UnifiedMessage.find({ conversationId, deletedAt: { $exists: false } }).sort({ createdAt: -1 }).limit(24).lean();
        const prompt = history.reverse().map((item) => (item.senderLabel || "Participant") + ": " + item.body).join("\\n\\n");
        const completion = await runProviderCompletion(String(agent.providerId), agent.modelName, agent.systemInstructions + "\\n\\nYou are responding as " + agent.name + " in the TGO DevStudio internal communications platform. Reply conversationally. You have no external tools in this conversation; do not claim to have performed actions you did not execute.", prompt);
        task.status = "completed"; task.result = completion.text.slice(0, 50000); task.inputTokens = completion.inputTokens; task.outputTokens = completion.outputTokens; task.providerRequestId = completion.providerRequestId; task.completedAt = new Date(); await task.save();
        const reply = await UnifiedMessage.create({ conversationId, senderType: "ai", senderLabel: agent.name, body: completion.text.slice(0, 12000), status: "sent" });
        conversation.lastMessageAt = new Date(); await conversation.save();
        await writePlatformAuditEvent({ actorType: "ai", actorId: String(agent._id), actorLabel: agent.name, action: "ai.conversation.replied", module: "communications", targetType: "AITask", targetId: String(task._id), outcome: "success", metadata: { conversationId, inputTokens: completion.inputTokens, outputTokens: completion.outputTokens } });
        return NextResponse.json({ status: "ok", message: { id: String(reply._id), body: reply.body, createdAt: reply.createdAt, senderLabel: agent.name, senderType: "ai" }, taskStatus: "completed" }, { status: 201 });
      } catch (error) {
        task.status = "failed"; task.error = (error instanceof Error ? error.message : "AI response failed.").slice(0, 2000); task.completedAt = new Date(); await task.save();
        await UnifiedMessage.create({ conversationId, senderType: "system", senderLabel: "TGO system", body: "The AI employee could not complete this response. The failed run is recorded in AI Workforce for review." });
        await writePlatformAuditEvent({ actorType: "ai", actorId: String(agent._id), actorLabel: agent.name, action: "ai.conversation.failed", module: "communications", targetType: "AITask", targetId: String(task._id), outcome: "failure", metadata: { conversationId, error: task.error } });
        return NextResponse.json({ status: "ok", taskStatus: "failed", message: "Your message is saved. The AI response failed and is recorded for review." }, { status: 201 });
      }
    }

    if (conversation.kind === "whatsapp" && whatsappCredentials) {
      const token = whatsappCredentials.accessToken;
      const phoneNumberId = whatsappCredentials.phoneNumberId;
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

  if (["react", "edit", "delete", "pin"].includes(String(body.action))) {
    const messageId = String(body.messageId || "");
    if (!Types.ObjectId.isValid(messageId)) return fail("A valid message ID is required.");
    const message = await UnifiedMessage.findById(messageId);
    if (!message) return fail("Message not found.", 404);
    const conversation = await UnifiedConversation.findById(message.conversationId);
    if (!conversation || (!conversation.memberIds.some((id) => String(id) === String(actorId)) && !session.role.isFounderRole)) return forbiddenResponse("You cannot modify this conversation.");
    if (body.action === "react") {
      const emoji = String(body.emoji || "").slice(0, 12);
      if (!emoji) return fail("Choose a reaction.");
      const existing = message.reactions.find((reaction) => String(reaction.userId) === String(actorId) && reaction.emoji === emoji);
      if (existing) message.reactions = message.reactions.filter((reaction) => !(String(reaction.userId) === String(actorId) && reaction.emoji === emoji));
      else message.reactions.push({ emoji, userId: actorId });
    } else if (body.action === "edit") {
      if (String(message.senderId || "") !== String(actorId)) return forbiddenResponse("Only the message author can edit this message.");
      const nextBody = String(body.body || "").trim();
      if (!nextBody || nextBody.length > 12000) return fail("Edited message must contain 1–12,000 characters.");
      message.body = nextBody; message.editedAt = new Date();
    } else if (body.action === "delete") {
      if (String(message.senderId || "") !== String(actorId) && !session.role.isFounderRole) return forbiddenResponse("Only the author or a founder can delete this message.");
      message.deletedAt = new Date(); message.body = "This message was deleted.";
    } else {
      if (!session.role.isFounderRole) return forbiddenResponse("Only a founder can pin or unpin messages.");
      message.pinned = Boolean(body.pinned);
    }
    await message.save();
    return NextResponse.json({ status: "ok", message: "Message updated." });
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
