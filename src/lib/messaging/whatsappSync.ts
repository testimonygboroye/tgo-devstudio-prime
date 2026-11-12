import { Types } from "mongoose";
import UserWhatsAppConnection from "@/models/UserWhatsAppConnection";
import UserWhatsAppDelivery from "@/models/UserWhatsAppDelivery";
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

  await Promise.allSettled(connections.map(async (connection) => {
    const credentials = decryptCredentials(connection.credentialsCiphertext);
    if (!credentials.accessToken || !connection.phoneNumberId || !connection.personalPhoneNumber) return;
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

    if (body) await saveDelivery(await sendWhatsAppPayload(connection.phoneNumberId, credentials.accessToken, connection.personalPhoneNumber, {
      type: "text", text: { preview_url: false, body: prefix + "\n" + body },
    }));

    for (const attachment of message.attachments || []) {
      const mime = String(attachment.mimeType || "").toLowerCase();
      let type = "document";
      let mediaKey = "document";
      if (mime.startsWith("image/") && mime !== "image/gif") { type = "image"; mediaKey = "image"; }
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
