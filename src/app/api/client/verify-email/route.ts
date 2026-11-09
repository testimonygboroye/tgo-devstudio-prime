import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { hashVerificationToken } from "@/lib/clients/email";
import ClientEmailVerification from "@/models/ClientEmailVerification";
import ClientActivity from "@/models/ClientActivity";
import User from "@/models/User";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export async function POST(request: NextRequest) {
  let token = "";
  try { token = String((await request.json()).token || ""); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (token.length < 30 || token.length > 200) return NextResponse.json({ error: "Verification link is invalid or expired." }, { status: 400 });
  await connectToDatabase();
  const record = await ClientEmailVerification.findOne({ tokenHash: hashVerificationToken(token), consumedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
  if (!record) return NextResponse.json({ error: "Verification link is invalid or expired. Request a new link." }, { status: 400 });
  const user = await User.findOne({ _id: record.userId, accountType: "client" });
  if (!user) return NextResponse.json({ error: "Client account could not be found." }, { status: 404 });
  record.consumedAt = new Date();
  user.isEmailVerified = true;
  user.emailVerifiedAt = new Date();
  await Promise.all([record.save(), user.save(), ClientActivity.create({
    clientId: user._id, actorId: user._id, actorType: "client",
    action: "client.email_verified", summary: "Client email address verified.",
  }), writePlatformAuditEvent({ actorType: "human", actorId: String(user._id), actorLabel: user.name, action: "client.email_verified", module: "clients", targetType: "client", targetId: String(user._id), outcome: "success" })]);
  return NextResponse.json({ ok: true, message: "Email verified. You can now sign in." });
}
