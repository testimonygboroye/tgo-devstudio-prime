import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { hashVerificationToken } from "@/lib/clients/token";
import { getPublicSiteUrl } from "@/lib/site-url";
import { sendNotificationEmail } from "@/lib/email/sendEmail";
import User from "@/models/User";
import ClientRegistrationVerification from "@/models/ClientRegistrationVerification";

export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}

export async function POST(request: NextRequest) {
  let email = "";
  try { email = String((await request.json()).email || "").trim().toLowerCase(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    return NextResponse.json({ error: "Email verification is temporarily unavailable. TGO DevStudio email delivery is not configured." }, { status: 503 });
  }

  await connectToDatabase();
  const existing = await User.findOne({ email, accountType: "client" }).select("_id");
  if (existing) return NextResponse.json({ error: "A client account already exists with this email. Please sign in instead." }, { status: 409 });

  const recent = await ClientRegistrationVerification.findOne({ email, createdAt: { $gt: new Date(Date.now() - 60_000) } }).sort({ createdAt: -1 });
  if (recent) return NextResponse.json({ ok: true, message: "A verification email was just sent. Check your inbox or wait one minute before requesting another." });

  const token = randomBytes(32).toString("base64url");
  await ClientRegistrationVerification.deleteMany({ email, consumedAt: { $exists: false } });
  await ClientRegistrationVerification.create({
    email, tokenHash: hashVerificationToken(token),
    expiresAt: new Date(Date.now() + 30 * 60_000),
  });

  const verifyUrl = new URL("/client/register/verify", getPublicSiteUrl(request));
  verifyUrl.searchParams.set("token", token);
  const result = await sendNotificationEmail({
    toEmail: email,
    toName: email.split("@")[0],
    subject: "Verify your email to create your TGO DevStudio account",
    htmlContent: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h1>Verify your email</h1><p>Use the secure link below to verify your email address before completing your TGO DevStudio client account.</p><p><a href="${escapeHtml(verifyUrl.toString())}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#6338e8;color:#fff;text-decoration:none">Verify email and continue</a></p><p>This link expires in 30 minutes. If you did not request an account, ignore this email.</p></div>`,
  });
  if (!result.success) {
    await ClientRegistrationVerification.deleteOne({ tokenHash: hashVerificationToken(token) });
    return NextResponse.json({ error: result.error || "The verification email could not be sent. Try again later." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, message: "Verification email sent. Open the link in your email to continue creating your account." });
}
