import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import ClientProfile from "@/models/ClientProfile";
import ClientPhoneVerification from "@/models/ClientPhoneVerification";
import ClientActivity from "@/models/ClientActivity";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";
function hashCode(userId: string, phone: string, code: string) {
  const secret = process.env.JWT_TEMP_2FA_SECRET;
  if (!secret) throw new Error("Phone verification signing secret is not configured.");
  return createHmac("sha256", secret).update(userId + ":" + phone + ":" + code).digest("hex");
}
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.accountType !== "client" || !session.user.isEmailVerified) return NextResponse.json({ error: "Verified client sign-in required." }, { status: 401 });
  let code = "";
  try { code = String((await request.json()).code || "").trim(); }
  catch { return NextResponse.json({ error: "Enter the six-digit SMS code." }, { status: 400 }); }
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the six-digit SMS code." }, { status: 400 });

  await connectToDatabase();
  const challenge = await ClientPhoneVerification.findOne({ userId: session.user._id, verifiedAt: { $exists: false }, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  if (!challenge) return NextResponse.json({ error: "The verification code has expired. Request a new code." }, { status: 400 });
  if (challenge.attempts >= 5) {
    await ClientPhoneVerification.deleteOne({ _id: challenge._id });
    return NextResponse.json({ error: "Too many incorrect attempts. Request a new verification code." }, { status: 429 });
  }
  const expected = Buffer.from(challenge.codeHash, "hex");
  const received = Buffer.from(hashCode(String(session.user._id), challenge.phone, code), "hex");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    challenge.attempts += 1;
    await challenge.save();
    return NextResponse.json({ error: `That code is incorrect. ${Math.max(0, 5 - challenge.attempts)} attempts remaining.` }, { status: 400 });
  }

  challenge.verifiedAt = new Date();
  const profile = await ClientProfile.findOne({ userId: session.user._id });
  if (!profile) return NextResponse.json({ error: "Client profile not found." }, { status: 404 });
  profile.phone = challenge.phone;
  profile.phoneVerifiedAt = new Date();
  await Promise.all([
    challenge.save(), profile.save(),
    ClientActivity.create({ clientId: session.user._id, actorId: session.user._id, actorType: "client", action: "client.phone_verified", summary: "Client verified their phone number by SMS.", metadata: { phone: challenge.phone.slice(0, 3) + "••••" + challenge.phone.slice(-3) } }),
    writePlatformAuditEvent({ actorType: "human", actorId: String(session.user._id), actorLabel: session.user.name, action: "client.phone_verified", module: "clients", targetType: "client", targetId: String(session.user._id), outcome: "success" }),
  ]);
  return NextResponse.json({ ok: true, message: "Your phone number has been verified successfully." });
}
