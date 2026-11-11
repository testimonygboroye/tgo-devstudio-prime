import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import { UnifiedConversation, UnifiedMessage } from "@/models/UnifiedConversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (query.get("hub.mode") === "subscribe" && verifyToken && query.get("hub.verify_token") === verifyToken) {
    return new Response(query.get("hub.challenge") || "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const signature = request.headers.get("x-hub-signature-256") || "";
  if (!appSecret || !signature.startsWith("sha256=")) return NextResponse.json({ error: "Webhook signature is not configured." }, { status: 401 });
  const expected = "sha256=" + createHmac("sha256", appSecret).update(raw).digest("hex");
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  let payload: { entry?: { changes?: { value?: { messages?: { id?: string; from?: string; type?: string; text?: { body?: string }; contacts?: { profile?: { name?: string } }[] }[]; statuses?: { id?: string; status?: string }[] } }[] }[] };
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  await connectToDatabase();
  let accepted = 0;
  for (const entry of payload.entry || []) for (const change of entry.changes || []) {
    const value = change.value || {};
    for (const status of value.statuses || []) {
      if (!status.id) continue;
      const normalized = status.status === "read" ? "read" : status.status === "delivered" ? "delivered" : status.status === "failed" ? "failed" : "sent";
      await UnifiedMessage.updateOne({ externalMessageId: status.id }, { $set: { status: normalized } });
    }
    for (const incoming of value.messages || []) {
      if (!incoming.id || !incoming.from || await UnifiedMessage.exists({ externalMessageId: incoming.id })) continue;
      const text = incoming.type === "text" ? String(incoming.text?.body || "").slice(0, 12000) : `[WhatsApp ${incoming.type || "message"} received. Media download is not enabled yet.]`;
      const name = value.contacts?.[0]?.profile?.name || incoming.from;
      const conversation = await UnifiedConversation.findOneAndUpdate(
        { kind: "whatsapp", externalContactId: incoming.from },
        { $set: { externalContactName: name, lastMessageAt: new Date() }, $setOnInsert: { kind: "whatsapp", title: name, memberIds: [], createdBy: undefined } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).catch(async () => UnifiedConversation.findOne({ kind: "whatsapp", externalContactId: incoming.from }));
      if (!conversation) continue;
      await UnifiedMessage.create({ conversationId: conversation._id, senderType: "external", senderLabel: name, body: text, externalMessageId: incoming.id, status: "delivered", messageType: incoming.type === "audio" ? "audio" : "text" });
      accepted++;
    }
  }
  return NextResponse.json({ ok: true, accepted });
}
