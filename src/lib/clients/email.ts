import { randomBytes } from "node:crypto";
import { hashVerificationToken } from "@/lib/clients/token";
export { hashVerificationToken } from "@/lib/clients/token";
import ClientEmailVerification from "@/models/ClientEmailVerification";

export async function createEmailVerification(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await ClientEmailVerification.deleteMany({ userId });
  await ClientEmailVerification.create({
    userId,
    tokenHash: hashVerificationToken(token),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });
  return token;
}

export async function sendClientVerificationEmail(email: string, name: string, token: string, siteUrl = process.env.SITE_URL) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from || !siteUrl) {
    throw new Error("Client verification email is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  }
  const verifyUrl = new URL("/client/verify-email", siteUrl);
  verifyUrl.searchParams.set("token", token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [email], subject: "Verify your TGO DevStudio client account",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h1>Welcome to TGO DevStudio</h1><p>Hello ${name.replace(/[&<>"]/g, "")},</p><p>Verify your email address to activate your client portal account.</p><p><a href="${verifyUrl.toString()}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#6338e8;color:#fff;text-decoration:none">Verify email address</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this message.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error("The verification email provider rejected the message.");
}
