import { Types } from "mongoose";
import UserWhatsAppConnection from "@/models/UserWhatsAppConnection";
import UserWhatsAppDelivery from "@/models/UserWhatsAppDelivery";
import IntegrationConnection from "@/models/IntegrationConnection";
import { decryptCredentials } from "@/lib/integrations/crypto";
import type { IUnifiedConversation, IUnifiedMessage } from "@/models/UnifiedConversation";

type WhatsAppResponse = { messages?: { id?: string }[]; error?: { message?: string } };

async function sendWhatsAppPayload(phoneNumberId: string, accessToken: string, to: string, payload: Record<string, unknown>) {
  const response = await fetch("https://graph.facebook.com/v22.0/" + encodeURIComponent(phoneNumberId) + "/messages", {
    method: "POST",
    headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, ...payload }),
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({})) as WhatsAppResponse;
  if (!response.ok || !result.messages?.[0]?.id) throw new Error(result.error?.message || "WhatsApp personal delivery failed.");
  return result.messages[0].id;
}

export async function mirrorMessageToPersonalWhatsApp(
  conversation: IUnifiedConversation,
  message: IUnifiedMessage,
  excludeUserId?: Types.ObjectId | string,
) {
  const members = conversation.memberIds || [];
  if (!members.length || message.senderType === "system") return;
  const filter: Record<string, unknown> = { userId: { $in: members }, status: "connected" };
  if (excludeUserId) filter.userId = { $in: members, $ne: excludeUserId };
  const connections = await UserWhatsAppConnection.find(filter).select("+credentialsCiphertext");
  let sharedCredentials: Record<string, string> = {};
  if (connections.some((connection) => !connection.credentialsCiphertext)) {
    const integration = await IntegrationConnection.findOne({ providerId: "whatsapp_cloud_api", status: "connected" }).select("+credentialsCiphertext");
    if (integration) { try { sharedCredentials = decryptCredentials(integration.credentialsCiphertext); } catch {} }
  }

  await Promise.allSettled(connections.map(async (connection) => {
    const credentials = connection.credentialsCiphertext ? decryptCredentials(connection.credentialsCiphertext) : sharedCredentials;
    const phoneNumberId = connection.phoneNumberId || sharedCredentials.phoneNumberId;
    if (!credentials.accessToken || !phoneNumberId || !connection.personalPhoneNumber || !connection.optInAt) return;
    connection.currentConversationId = conversation._id as Types.ObjectId;
    await connection.save();
    // Meta's free-form service window is per recipient and opens when that person messages the business number.
    if (!connection.lastInboundAt || Date.now() - connection.lastInboundAt.getTime() > 24 * 60 * 60 * 1000) return;

    const title = String(conversation.title || "TGO conversation").slice(0, 80);
    const label = String(message.senderLabel || "TGO").slice(0, 80);
    const prefix = "[" + title + " · " + label + "]";
    const body = String(message.body || "").slice(0, 3000);
    const saveDelivery = async (externalMessageId: string) => {
      await UserWhatsAppDelivery.create({ messageId: message._id, userId: connection.userId, externalMessageId, status: "sent" });
    };

    if (body) await saveDelivery(await sendWhatsAppPayload(phoneNumberId, credentials.accessToken, connection.personalPhoneNumber, {
      type: "text", text: { preview_url: false, body: prefix + "\n" + body },
    }));

    for (const attachment of message.attachments || []) {
      const mime = String(attachment.mimeType || "").toLowerCase();
      let type = "document";
      let mediaKey = "document";
      if (["image/jpeg", "image/png"].includes(mime)) { type = "image"; mediaKey = "image"; }
      else if (mime === "video/mp4") { type = "video"; mediaKey = "video"; }
      else if (["audio/mpeg", "audio/mp4", "audio/ogg"].includes(mime)) { type = "audio"; mediaKey = "audio"; }
      const media: Record<string, unknown> = { link: attachment.url };
      if (mediaKey !== "audio") {
        if (mediaKey === "document") media.filename = String(attachment.name || "attachment").slice(0, 180);
        media.caption = prefix;
      }
      await saveDelivery(await sendWhatsAppPayload(connection.phoneNumberId, credentials.accessToken, connection.personalPhoneNumber, {
        type, [mediaKey]: media,
      }));
    }
  }));
}


export async function sendSupportWhatsAppToClient(
  clientId: Types.ObjectId | string,
  supportTicketId: Types.ObjectId | string,
  text: string,
): Promise<{ sent: boolean; reason?: string }> {
  const connection = await UserWhatsAppConnection.findOne({ userId: clientId, status: "connected" }).select("+credentialsCiphertext");
  if (!connection || !connection.optInAt) return { sent: false, reason: "No opted-in WhatsApp destination is registered." };
  if (!connection.lastInboundAt || Date.now() - connection.lastInboundAt.getTime() > 24 * 60 * 60 * 1000) {
    return { sent: false, reason: "The WhatsApp customer-service window is closed; an approved template is required." };
  }

  let credentials: Record<string, string> = {};
  try { if (connection.credentialsCiphertext) credentials = decryptCredentials(connection.credentialsCiphertext); } catch {}
  if (!credentials.accessToken) {
    const integration = await IntegrationConnection.findOne({ providerId: "whatsapp_cloud_api", status: "connected" }).select("+credentialsCiphertext");
    if (integration) { try { credentials = decryptCredentials(integration.credentialsCiphertext); } catch {} }
  }
  const phoneNumberId = connection.phoneNumberId || credentials.phoneNumberId;
  if (!credentials.accessToken || !phoneNumberId) return { sent: false, reason: "The shared WhatsApp sender is not configured." };

  try {
    const externalMessageId = await sendWhatsAppPayload(phoneNumberId, credentials.accessToken, connection.personalPhoneNumber, {
      type: "text",
      text: { preview_url: false, body: String(text || "").slice(0, 3000) },
    });
    await UserWhatsAppDelivery.create({
      supportTicketId,
      userId: connection.userId,
      externalMessageId,
      status: "sent",
    });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "WhatsApp delivery failed." };
  }
}
