import { randomBytes } from "node:crypto";
import { hashVerificationToken } from "@/lib/clients/token";
export { hashVerificationToken } from "@/lib/clients/token";
import ClientEmailVerification from "@/models/ClientEmailVerification";
import { sendNotificationEmail } from "@/lib/email/sendEmail";
import { getPublicSiteUrl } from "@/lib/site-url";

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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character);
}

export async function sendClientVerificationEmail(email: string, name: string, token: string, siteUrl: string) {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    throw new Error("Client verification email is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.");
  }
  const publicOrigin = getPublicSiteUrl();
  const verifyUrl = new URL("/client/verify-email", publicOrigin);
  verifyUrl.searchParams.set("token", token);
  const result = await sendNotificationEmail({
    toEmail: email,
    toName: name,
    subject: "Verify your TGO DevStudio client account",
    htmlContent: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h1>Welcome to TGO DevStudio</h1><p>Hello ${escapeHtml(name)},</p><p>Verify your email address to activate your client portal account.</p><p><a href="${escapeHtml(verifyUrl.toString())}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#6338e8;color:#fff;text-decoration:none">Verify email address</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this message.</p></div>`,
  });
  if (!result.success) {
    throw new Error(result.error || "Brevo could not send the client verification email.");
  }
}
