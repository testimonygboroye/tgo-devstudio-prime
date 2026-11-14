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
  try { phone = String((await request.json()).phone || "").trim(); }
  catch { return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 }); }
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return NextResponse.json({ error: "Use an international phone number in E.164 format, including the country calling code." }, { status: 400 });

  const savedTwilio = await getVerifiedIntegrationCredentials("twilio").catch(() => null);
  const sid = process.env.TWILIO_ACCOUNT_SID || savedTwilio?.accountSid;
  const authToken = process.env.TWILIO_AUTH_TOKEN || savedTwilio?.authToken;
  const from = process.env.TWILIO_SMS_FROM || savedTwilio?.fromNumber;
  const messagingService = process.env.TWILIO_MESSAGING_SERVICE_SID || savedTwilio?.messagingServiceSid;
  if (!sid || !authToken || (!from && !messagingService) || !process.env.JWT_TEMP_2FA_SECRET) {
    return NextResponse.json({ error: "SMS verification is not ready. Verify Twilio in Integration Centre and provide a verified sender number or Messaging Service SID. JWT_TEMP_2FA_SECRET must also be configured." }, { status: 503 });
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

  const form = new URLSearchParams({ To: phone, Body: `Your TGO DevStudio phone verification code is ${code}. It expires in 5 minutes. Do not share this code.` });
  if (messagingService) form.set("MessagingServiceSid", messagingService);
  else form.set("From", from!);
  const auth = Buffer.from(sid + ":" + authToken).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST", headers: { Authorization: "Basic " + auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: form, cache: "no-store",
  });
  if (!response.ok) {
    await ClientPhoneVerification.deleteOne({ _id: challenge._id });
    const provider = await response.json().catch(() => ({})) as { message?: string };
    console.error("Twilio SMS delivery failed", provider.message || response.status);
    return NextResponse.json({ error: "Twilio could not deliver the SMS. Check the verified sender, recipient permissions and account balance." }, { status: 502 });
  }

  const masked = phone.slice(0, 3) + "••••" + phone.slice(-3);
  await Promise.all([
    ClientActivity.create({ clientId: session.user._id, actorId: session.user._id, actorType: "client", action: "client.phone_verification_sent", summary: "Phone verification code sent by SMS.", metadata: { phone: masked } }),
    writePlatformAuditEvent({ actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name, action: "client.phone_verification_sent", module: "clients", targetType: "client", targetId: String(session.user._id), outcome: "success", metadata: { phone: masked } }),
  ]);
  return NextResponse.json({ ok: true, message: "A six-digit verification code has been sent by SMS. It expires in five minutes." });
}
