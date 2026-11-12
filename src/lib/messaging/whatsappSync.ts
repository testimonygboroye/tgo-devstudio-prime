import { Types } from "mongoose";
import UserWhatsAppConnection from "@/models/UserWhatsAppConnection";
import UserWhatsAppDelivery from "@/models/UserWhatsAppDelivery";
import { decryptCredentials } from "@/lib/integrations/crypto";
import type { IUnifiedConversation, IUnifiedMessage } from "@/models/UnifiedConversation";

export async function mirrorMessageToPersonalWhatsApp(conversation: IUnifiedConversation, message: IUnifiedMessage, excludeUserId?: Types.ObjectId | string) {
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
    const label = String(message.senderLabel || "TGO").slice(0, 80);
    const title = String(conversation.title || "TGO conversation").slice(0, 80);
    const text = "[" + title + " · " + label + "]\n" + String(message.body || "").slice(0, 3500);
    const response = await fetch("https://graph.facebook.com/v22.0/" + encodeURIComponent(connection.phoneNumberId) + "/messages", {
      method: "POST",
      headers: { Authorization: "Bearer " + credentials.accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: connection.personalPhoneNumber, type: "text", text: { preview_url: false, body: text } }),
      signal: AbortSignal.timeout(12000), cache: "no-store",
    });
    const result = await response.json().catch(() => ({})) as { messages?: { id?: string }[]; error?: { message?: string } };
    if (!response.ok || !result.messages?.[0]?.id) throw new Error(result.error?.message || "WhatsApp personal delivery failed.");
    await UserWhatsAppDelivery.create({ messageId: message._id, userId: connection.userId, externalMessageId: result.messages[0].id, status: "sent" });
  }));
}
