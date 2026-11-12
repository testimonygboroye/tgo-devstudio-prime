import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import { UnifiedConversation, UnifiedMessage } from "@/models/UnifiedConversation";
import UserWhatsAppConnection from "@/models/UserWhatsAppConnection";
import UserWhatsAppDelivery from "@/models/UserWhatsAppDelivery";
import { AIAgent, AITask } from "@/models/AIWorkforce";
import { runProviderCompletion } from "@/lib/ai/provider-runtime";
import { mirrorMessageToPersonalWhatsApp } from "@/lib/messaging/whatsappSync";
import { decryptCredentials } from "@/lib/integrations/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function findConnection(phoneNumberId?: string, verifyToken?: string) {
  await connectToDatabase();
  if (phoneNumberId) {
    const row = await UserWhatsAppConnection.findOne({ phoneNumberId, status: "connected" }).select("+credentialsCiphertext");
    if (!row) return null;
    const credentials = decryptCredentials(row.credentialsCiphertext);
    return { row, credentials };
  }
  const rows = await UserWhatsAppConnection.find({ status: "connected" }).select("+credentialsCiphertext").limit(500);
  for (const row of rows) {
    try { const credentials = decryptCredentials(row.credentialsCiphertext); if (credentials.webhookVerifyToken === verifyToken) return { row, credentials }; } catch {}
  }
  return null;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  if (query.get("hub.mode") !== "subscribe" || !query.get("hub.verify_token")) return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
  const connection = await findConnection(undefined, query.get("hub.verify_token") || "");
  if (!connection) return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
  return new Response(query.get("hub.challenge") || "", { status: 200, headers: { "Content-Type": "text/plain" } });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  let payload: { entry?: { changes?: { value?: { metadata?: { phone_number_id?: string }; messages?: { id?: string; from?: string; type?: string; text?: { body?: string }; context?: { id?: string } }[]; contacts?: { profile?: { name?: string } }[]; statuses?: { id?: string; status?: string }[] } }[] }[] };
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const phoneNumberId = payload.entry?.flatMap((entry) => entry.changes || []).map((change) => change.value?.metadata?.phone_number_id).find(Boolean);
  if (!phoneNumberId) return NextResponse.json({ ok: true, ignored: true });
  const connection = await findConnection(phoneNumberId);
  if (!connection) return NextResponse.json({ error: "No personal WhatsApp connection matches this business number." }, { status: 404 });
  const signature = request.headers.get("x-hub-signature-256") || "";
  const appSecret = connection.credentials.appSecret || "";
  if (!appSecret || !signature.startsWith("sha256=")) return NextResponse.json({ error: "Webhook signature is not configured." }, { status: 401 });
  const expected = "sha256=" + createHmac("sha256", appSecret).update(raw).digest("hex");
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });

  let accepted = 0;
  for (const entry of payload.entry || []) for (const change of entry.changes || []) {
    const value = change.value || {};
    for (const status of value.statuses || []) {
      if (!status.id) continue;
      const normalized = status.status === "read" ? "read" : status.status === "delivered" ? "delivered" : status.status === "failed" ? "failed" : "sent";
      await UserWhatsAppDelivery.updateOne({ externalMessageId: status.id, userId: connection.row.userId }, { $set: { status: normalized } });
    }
    for (const incoming of value.messages || []) {
      if (!incoming.id || !incoming.from || await UnifiedMessage.exists({ externalMessageId: incoming.id })) continue;
      // A connection only accepts messages from the owner's explicitly configured personal number.
      if (incoming.from.replace(/[^0-9]/g, "") !== connection.row.personalPhoneNumber) continue;
      connection.row.lastInboundAt = new Date(); await connection.row.save();
      let conversationId = incoming.context?.id
        ? (await UserWhatsAppDelivery.findOne({ externalMessageId: incoming.context.id, userId: connection.row.userId }).select("messageId"))?.messageId
        : undefined;
      let conversation = conversationId ? await UnifiedConversation.findOne({ _id: (await UnifiedMessage.findById(conversationId).select("conversationId"))?.conversationId, memberIds: connection.row.userId }) : null;
      if (!conversation && connection.row.currentConversationId) conversation = await UnifiedConversation.findOne({ _id: connection.row.currentConversationId, memberIds: connection.row.userId });
      if (!conversation) {
        conversation = await UnifiedConversation.create({ kind: "whatsapp", title: "My WhatsApp", createdBy: connection.row.userId, memberIds: [connection.row.userId], externalContactId: connection.row.personalPhoneNumber, externalContactName: "My personal WhatsApp" });
        connection.row.currentConversationId = conversation._id; await connection.row.save();
      }
      const name = value.contacts?.[0]?.profile?.name || "Me";
      const text = incoming.type === "text" ? String(incoming.text?.body || "").slice(0, 12000) : "[WhatsApp " + (incoming.type || "message") + " received. Media import is not enabled yet.]";
      const inboundMessage = await UnifiedMessage.create({ conversationId: conversation._id, senderType: "external", senderLabel: name, body: text, externalMessageId: incoming.id, status: "delivered", messageType: incoming.type === "audio" ? "audio" : "text" });
      conversation.lastMessageAt = new Date(); await conversation.save(); accepted++;
      await mirrorMessageToPersonalWhatsApp(conversation, inboundMessage, connection.row.userId);
      if (conversation.kind === "ai" && conversation.aiAgentId && incoming.type === "text" && text.trim()) {
        const agent = await AIAgent.findOne({ _id: conversation.aiAgentId, enabled: true });
        if (agent) {
          const task = await AITask.create({ agentId: agent._id, title: "WhatsApp conversation with " + name, input: text, requestedBy: String(connection.row.userId), status: agent.requiresApproval ? "awaiting_approval" : "queued", operationPayload: { source: "whatsapp_ai_conversation", conversationId: String(conversation._id) } });
          if (agent.requiresApproval) {
            await UnifiedMessage.create({ conversationId: conversation._id, senderType: "system", senderLabel: "TGO system", body: "Your WhatsApp message was received. This AI employee requires approval before responding. Task " + String(task._id) + " is awaiting approval." });
          } else {
            const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
            const usage = await AITask.aggregate([{ $match: { agentId: agent._id, status: { $in: ["completed", "running"] }, createdAt: { $gte: dayStart } } }, { $group: { _id: null, tokens: { $sum: { $add: ["$inputTokens", "$outputTokens"] } } } }]);
            if (Number(usage[0]?.tokens || 0) >= agent.maxDailyTokens) {
              task.status = "awaiting_approval"; task.error = "Daily token budget reached; founder review required."; await task.save();
              await UnifiedMessage.create({ conversationId: conversation._id, senderType: "system", senderLabel: "TGO system", body: "The AI employee reached its configured daily token budget. Your WhatsApp message is waiting for founder review." });
            } else {
              task.status = "running"; task.startedAt = new Date(); task.executionAttempts += 1; await task.save();
              try {
                const history = await UnifiedMessage.find({ conversationId: conversation._id, deletedAt: { $exists: false } }).sort({ createdAt: -1 }).limit(24).lean();
                const prompt = history.reverse().map((item) => (item.senderLabel || "Participant") + ": " + item.body).join("\n\n");
                const completion = await runProviderCompletion(String(agent.providerId), agent.modelName, agent.systemInstructions + "\n\nYou are responding as " + agent.name + " in the owner's private TGO conversation. Reply conversationally. Do not claim actions you did not perform.", prompt);
                task.status = "completed"; task.result = completion.text.slice(0, 50000); task.inputTokens = completion.inputTokens; task.outputTokens = completion.outputTokens; task.providerRequestId = completion.providerRequestId; task.completedAt = new Date(); await task.save();
                const reply = await UnifiedMessage.create({ conversationId: conversation._id, senderType: "ai", senderLabel: agent.name, body: completion.text.slice(0, 12000), status: "sent" });
                conversation.lastMessageAt = new Date(); await conversation.save();
                await mirrorMessageToPersonalWhatsApp(conversation, reply);
              } catch (error) {
                task.status = "failed"; task.error = (error instanceof Error ? error.message : "AI response failed.").slice(0, 2000); task.completedAt = new Date(); await task.save();
                await UnifiedMessage.create({ conversationId: conversation._id, senderType: "system", senderLabel: "TGO system", body: "The AI employee could not complete this WhatsApp response. The failed run is recorded for review." });
              }
            }
          }
        }
      }
    }
  }
  return NextResponse.json({ ok: true, accepted });
}
