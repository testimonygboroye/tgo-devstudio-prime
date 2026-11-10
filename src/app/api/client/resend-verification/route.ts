import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { createEmailVerification, sendClientVerificationEmail } from "@/lib/clients/email";
import { getSiteUrl } from "@/lib/siteUrl";

export async function POST(request: NextRequest) {
  let email = "";
  try { email = String((await request.json()).email || "").trim().toLowerCase(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  await connectToDatabase();
  const user = await User.findOne({ email, accountType: "client", isEmailVerified: false });
  if (!user) return NextResponse.json({ ok: true, message: "If an unverified client account exists, a new verification email has been sent." });
  const recent = await (await import("@/models/ClientEmailVerification")).default.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (recent && Date.now() - recent.createdAt.getTime() < 60_000) {
    return NextResponse.json({ ok: true, message: "A verification message was recently requested. Please check your inbox or wait one minute before trying again." });
  }
  try {
    const token = await createEmailVerification(String(user._id));
    await sendClientVerificationEmail(email, user.name, token, getSiteUrl());
  } catch {
    return NextResponse.json({ error: "Verification email could not be sent. Please try again later." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, message: "A new verification email has been sent." });
}
