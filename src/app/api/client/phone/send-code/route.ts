import { createHmac, randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientProfile from "@/models/ClientProfile";
import ClientPhoneVerification from "@/models/ClientPhoneVerification";
import ClientActivity from "@/models/ClientActivity";
import { writePlatformAuditEvent } from "@/lib/platform/audit";
import { getVerifiedIntegrationCredentials } from "@/lib/integrations/credentials";

export const dynamic = "force-dynamic";
function hashCode(userId: string, phone: string, code: string) {
  const secret = process.env.JWT_TEMP_2FA_SECRET;
  if (!secret) throw new Error("Phone verification signing secret is not configured.");
  return createHmac("sha256", secret).update(userId + ":" + phone + ":" + code).digest("hex");
}
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) return NextResponse.json({ error: "Verified client sign-in required." }, { status: 401 });
  let phone = "";
  let channel: "sms" | "whatsapp" = "sms";
  try {
    const body = await request.json() as { phone?: unknown; channel?: unknown };
    phone = String(body.phone || "").trim();
    channel = body.channel === "whatsapp" ? "whatsapp" : "sms";
  } catch { return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 }); }
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return NextResponse.json({ error: "Use an international phone number in E.164 format, including the country calling code." }, { status: 400 });

  const savedTwilio = channel === "sms" ? await getVerifiedIntegrationCredentials("twilio").catch(() => null) : null;
  const sid = savedTwilio?.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = savedTwilio?.authToken || process.env.TWILIO_AUTH_TOKEN;
  const from = savedTwilio?.fromNumber || process.env.TWILIO_SMS_FROM;
  const messagingService = savedTwilio?.messagingServiceSid || process.env.TWILIO_MESSAGING_SERVICE_SID;
  const whatsappCredentials = channel === "whatsapp" ? await getVerifiedIntegrationCredentials("whatsapp_cloud_api").catch(() => null) : null;
  const whatsappTemplateName = whatsappCredentials?.verificationTemplateName || process.env.WHATSAPP_VERIFICATION_TEMPLATE_NAME || "";
  const whatsappTemplateLanguage = whatsappCredentials?.verificationTemplateLanguage || process.env.WHATSAPP_VERIFICATION_TEMPLATE_LANGUAGE || "en_US";
  if (!process.env.JWT_TEMP_2FA_SECRET) return NextResponse.json({ error: "Phone verification signing secret JWT_TEMP_2FA_SECRET is not configured." }, { status: 503 });
  if (channel === "sms" && (!sid || !authToken || (!from && !messagingService))) {
    return NextResponse.json({ error: "SMS verification is not ready. Verify Twilio in Integration Centre and provide a verified sender number or Messaging Service SID." }, { status: 503 });
  }
  if (channel === "whatsapp" && (!whatsappCredentials?.accessToken || !whatsappCredentials.phoneNumberId || !whatsappTemplateName)) {
    return NextResponse.json({ error: "WhatsApp verification requires a verified TGO WhatsApp Cloud API sender and an approved AUTHENTICATION template. Set its template name in Integration Centre or WHATSAPP_VERIFICATION_TEMPLATE_NAME." }, { status: 503 });
  }

  await connectToDatabase();
  const profile = await ClientProfile.findOne({ userId: session.user._id });
  if (!profile) return NextResponse.json({ error: "Client profile not found." }, { status: 404 });
  const recent = await ClientPhoneVerification.findOne({ userId: session.user._id, createdAt: { $gt: new Date(Date.now() - 60_000) } }).sort({ createdAt: -1 });
  if (recent) return NextResponse.json({ error: "A verification code was sent recently. Wait one minute before requesting another." }, { status: 429 });

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await ClientPhoneVerification.deleteMany({ userId: session.user._id });
  const challenge = await ClientPhoneVerification.create({
    userId: session.user._id, phone, codeHash: hashCode(String(session.user._id), phone, code),
    expiresAt: new Date(Date.now() + 5 * 60_000), attempts: 0,
  });

  let deliveryResponse: Response;
  let providerMessage = "";
  if (channel === "whatsapp") {
    deliveryResponse = await fetch("https://graph.facebook.com/v22.0/" + encodeURIComponent(whatsappCredentials!.phoneNumberId) + "/messages", {
      method: "POST",
      headers: { Authorization: "Bearer " + whatsappCredentials!.accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone.replace(/\D/g, ""),
        type: "template",
        template: {
          name: whatsappTemplateName,
          language: { code: whatsappTemplateLanguage },
          components: [{ type: "body", parameters: [{ type: "text", text: code }] }, { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] }],
        },
      }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    const payload = await deliveryResponse.json().catch(() => ({})) as { messages?: { id?: string }[]; error?: { message?: string } };
    providerMessage = payload.error?.message || "";
    if (deliveryResponse.ok && !payload.messages?.[0]?.id) providerMessage = "Meta accepted no WhatsApp message identifier.";
  } else {
    const form = new URLSearchParams({ To: phone, Body: `Your TGO DevStudio phone verification code is ${code}. It expires in 5 minutes. Do not share this code.` });
    if (messagingService) form.set("MessagingServiceSid", messagingService);
    else form.set("From", from!);
    const auth = Buffer.from(sid + ":" + authToken).toString("base64");
    deliveryResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST", headers: { Authorization: "Basic " + auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: form, cache: "no-store",
    });
    if (!deliveryResponse.ok) {
      const provider = await deliveryResponse.json().catch(() => ({})) as { message?: string };
      providerMessage = provider.message || "";
    }
  }
  if (!deliveryResponse.ok || providerMessage) {
    await ClientPhoneVerification.deleteOne({ _id: challenge._id });
    console.error("Phone verification delivery failed", channel, providerMessage || deliveryResponse.status);
    return NextResponse.json({ error: channel === "whatsapp"
      ? "TGO WhatsApp could not deliver the authentication template. Check template approval, language, sender permissions and recipient WhatsApp availability."
      : "Twilio could not deliver the SMS. Check the verified sender, recipient permissions and account balance." }, { status: 502 });
  }

  const masked = phone.slice(0, 3) + "••••" + phone.slice(-3);
  await Promise.all([
    ClientActivity.create({ clientId: session.user._id, actorId: session.user._id, actorType: "client", action: "client.phone_verification_sent", summary: "Phone verification code sent by " + channel + ".", metadata: { phone: masked, channel } }),
    writePlatformAuditEvent({ actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name, action: "client.phone_verification_sent", module: "clients", targetType: "client", targetId: String(session.user._id), outcome: "success", metadata: { phone: masked, channel } }),
  ]);
  return NextResponse.json({ ok: true, message: "A six-digit verification code has been sent by " + channel + ". It expires in five minutes." });
}
