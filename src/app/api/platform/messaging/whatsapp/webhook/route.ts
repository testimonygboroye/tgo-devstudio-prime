import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import { randomUUID } from "node:crypto";
import User from "@/models/User";
import SupportTicket from "@/models/SupportTicket";
import { UnifiedConversation, UnifiedMessage } from "@/models/UnifiedConversation";
import UserWhatsAppConnection from "@/models/UserWhatsAppConnection";
import UserWhatsAppDelivery from "@/models/UserWhatsAppDelivery";
import IntegrationConnection from "@/models/IntegrationConnection";
import { AIAgent, AITask } from "@/models/AIWorkforce";
import { runProviderCompletion } from "@/lib/ai/provider-runtime";
import { mirrorMessageToPersonalWhatsApp } from "@/lib/messaging/whatsappSync";
import { decryptCredentials } from "@/lib/integrations/crypto";
import { ensureWhatsAppRecipientIndexes } from "@/lib/messaging/whatsappIndexes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadSharedCredentials() {
  const integration = await IntegrationConnection.findOne({ providerId: "whatsapp_cloud_api", status: "connected" }).select("+credentialsCiphertext");
  if (!integration) return null;
  try { return decryptCredentials(integration.credentialsCiphertext); } catch { return null; }
}

async function credentialsForWebhook(phoneNumberId?: string, verifyToken?: string) {
  const shared = await loadSharedCredentials();
  if (shared?.accessToken && shared.phoneNumberId && shared.appSecret && shared.webhookVerifyToken) {
    if ((!phoneNumberId || shared.phoneNumberId === phoneNumberId) && (!verifyToken || shared.webhookVerifyToken === verifyToken)) return shared;
  }
  const rows = await UserWhatsAppConnection.find({ status: "connected", ...(phoneNumberId ? { phoneNumberId } : {}) }).select("+credentialsCiphertext").limit(500);
  for (const row of rows) {
    try {
      if (!row.credentialsCiphertext) continue;
      const credentials = decryptCredentials(row.credentialsCiphertext);
      if ((!phoneNumberId || row.phoneNumberId === phoneNumberId) && (!verifyToken || credentials.webhookVerifyToken === verifyToken)) return credentials;
    } catch {}
  }
  return null;
}

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const query = request.nextUrl.searchParams;
  const verifyToken = query.get("hub.verify_token") || "";
  if (query.get("hub.mode") !== "subscribe" || !verifyToken) return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
  const credentials = await credentialsForWebhook(undefined, verifyToken);
  if (!credentials) return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
  return new Response(query.get("hub.challenge") || "", { status: 200, headers: { "Content-Type": "text/plain" } });
}

export async function POST(request: NextRequest) {
  await connectToDatabase();
  await ensureWhatsAppRecipientIndexes();
  const raw = await request.text();
  let payload: { entry?: { changes?: { value?: { metadata?: { phone_number_id?: string }; messages?: { id?: string; from?: string; type?: string; text?: { body?: string }; context?: { id?: string } }[]; contacts?: { profile?: { name?: string } }[]; statuses?: { id?: string; status?: string }[] } }[] }[] };
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const phoneNumberId = payload.entry?.flatMap((entry) => entry.changes || []).map((change) => change.value?.metadata?.phone_number_id).find(Boolean);
  if (!phoneNumberId) return NextResponse.json({ ok: true, ignored: true });
  const credentials = await credentialsForWebhook(phoneNumberId);
  if (!credentials?.appSecret) return NextResponse.json({ error: "WhatsApp sender is not configured." }, { status: 404 });
  const signature = request.headers.get("x-hub-signature-256") || "";
  const expected = "sha256=" + createHmac("sha256", credentials.appSecret).update(raw).digest("hex");
  const actualBytes = Buffer.from(signature), expectedBytes = Buffer.from(expected);
  if (!signature.startsWith("sha256=") || actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let accepted = 0;
  for (const entry of payload.entry || []) for (const change of entry.changes || []) {
    const value = change.value || {};
    if (value.metadata?.phone_number_id !== phoneNumberId) continue;
    for (const status of value.statuses || []) {
      if (!status.id) continue;
      const normalized = status.status === "read" ? "read" : status.status === "delivered" ? "delivered" : status.status === "failed" ? "failed" : "sent";
      await UserWhatsAppDelivery.updateOne({ externalMessageId: status.id }, { $set: { status: normalized } });
    }
    for (const incoming of value.messages || []) {
      if (!incoming.id || !incoming.from || await UnifiedMessage.exists({ externalMessageId: incoming.id })) continue;
      const senderNumber = incoming.from.replace(/[^0-9]/g, "");
      const recipient = await UserWhatsAppConnection.findOne({ phoneNumberId, personalPhoneNumber: senderNumber, status: "connected" });
      if (!recipient || !recipient.optInAt) continue;
      recipient.lastInboundAt = new Date();
      await recipient.save();

      const account = await User.findById(recipient.userId).select("accountType name").lean();
      if (account?.accountType === "client") {
        const clientText = incoming.type === "text"
          ? String(incoming.text?.body || "").slice(0, 10000)
          : "[WhatsApp " + (incoming.type || "message") + " received. Open WhatsApp to view the original media.]";
        if (!clientText.trim()) continue;
        let ticket = await SupportTicket.findOne({ clientId: recipient.userId, status: { $nin: ["resolved", "closed"] } }).sort({ updatedAt: -1 });
        if (!ticket) {
          const now = new Date();
          ticket = await SupportTicket.create({
            reference: "TGO-SUP-" + now.toISOString().slice(0, 10).replace(/-/g, "") + "-" + randomUUID().slice(0, 8).toUpperCase(),
            clientId: recipient.userId,
            subject: "WhatsApp support conversation",
            description: clientText.length >= 10 ? clientText : "WhatsApp message: " + clientText,
            category: "General enquiry",
            status: "open",
            priority: "normal",
            escalationLevel: 0,
            firstResponseDueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            resolutionDueAt: new Date(now.getTime() + 72 * 60 * 60 * 1000),
            messages: [{ senderId: recipient.userId, senderType: "client", body: clientText, attachments: [], createdAt: now }],
          });
        } else {
          ticket.messages.push({ senderId: recipient.userId, senderType: "client", body: clientText, attachments: [], createdAt: new Date() });
          ticket.status = "waiting_on_team";
          await ticket.save();
        }
        accepted++;
        continue;
      }

      let conversation = recipient.currentConversationId
        ? await UnifiedConversation.findOne({ _id: recipient.currentConversationId, memberIds: recipient.userId })
        : null;
      if (!conversation) {
        conversation = await UnifiedConversation.findOne({ kind: "whatsapp", memberIds: recipient.userId, externalContactId: recipient.personalPhoneNumber });
      }
      if (!conversation) {
        conversation = await UnifiedConversation.create({
          kind: "whatsapp",
          title: "WhatsApp conversation",
          createdBy: recipient.userId,
          memberIds: [recipient.userId],
          externalContactId: recipient.personalPhoneNumber,
          externalContactName: "My WhatsApp",
        });
      }
      recipient.currentConversationId = conversation._id;
      await recipient.save();

      const contactName = value.contacts?.[0]?.profile?.name || "WhatsApp contact";
      const text = incoming.type === "text"
        ? String(incoming.text?.body || "").slice(0, 12000)
        : "[WhatsApp " + (incoming.type || "message") + " received. Open WhatsApp to view the original media.]";
      const message = await UnifiedMessage.create({
        conversationId: conversation._id,
        senderType: "external",
        senderLabel: contactName,
        body: text,
        externalMessageId: incoming.id,
        status: "delivered",
        messageType: incoming.type === "audio" ? "audio" : "text",
      });
      conversation.lastMessageAt = new Date();
      await conversation.save();
      accepted++;
      await mirrorMessageToPersonalWhatsApp(conversation, message, recipient.userId);

      if (conversation.kind === "ai" && conversation.aiAgentId && incoming.type === "text" && text.trim()) {
        const agent = await AIAgent.findOne({ _id: conversation.aiAgentId, enabled: true });
        if (agent && !agent.requiresApproval) {
          const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
          const usage = await AITask.aggregate([
            { $match: { agentId: agent._id, status: { $in: ["completed", "running"] }, createdAt: { $gte: dayStart } } },
            { $group: { _id: null, tokens: { $sum: { $add: ["$inputTokens", "$outputTokens"] } } } },
          ]);
          if (Number(usage[0]?.tokens || 0) < agent.maxDailyTokens) {
            const task = await AITask.create({ agentId: agent._id, title: "WhatsApp conversation with " + contactName, input: text, requestedBy: String(recipient.userId), status: "running", startedAt: new Date(), executionAttempts: 1, operationPayload: { source: "whatsapp_ai_conversation", conversationId: String(conversation._id) } });
            try {
              const history = await UnifiedMessage.find({ conversationId: conversation._id, deletedAt: { $exists: false } }).sort({ createdAt: -1 }).limit(24).lean();
              const prompt = history.reverse().map((item) => (item.senderLabel || "Participant") + ": " + item.body).join("\n\n");
              const completion = await runProviderCompletion(String(agent.providerId), agent.modelName, agent.systemInstructions + "\n\nYou are responding as " + agent.name + " in the owner's private TGO conversation. Do not claim actions you did not perform.", prompt);
              task.status = "completed"; task.result = completion.text.slice(0, 50000); task.inputTokens = completion.inputTokens; task.outputTokens = completion.outputTokens; task.providerRequestId = completion.providerRequestId; task.completedAt = new Date(); await task.save();
              const reply = await UnifiedMessage.create({ conversationId: conversation._id, senderType: "ai", senderLabel: agent.name, body: completion.text.slice(0, 12000), status: "sent" });
              conversation.lastMessageAt = new Date(); await conversation.save();
              await mirrorMessageToPersonalWhatsApp(conversation, reply);
            } catch (error) {
              task.status = "failed"; task.error = (error instanceof Error ? error.message : "AI response failed.").slice(0, 2000); task.completedAt = new Date(); await task.save();
            }
          }
        }
      }
    }
  }
  return NextResponse.json({ ok: true, accepted });
}
