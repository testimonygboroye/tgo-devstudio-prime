import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface Params {
  toEmail: string;
  toName: string;
  disableUrl: string;
}

export async function send2FARecoveryEmail({ toEmail, toName, disableUrl }: Params): Promise<void> {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">Two-Factor Authentication Recovery</h2>
      <p>Hi ${toName},</p>
      <p>We received a request to disable two-factor authentication on your account because access was lost.</p>
      <p style="margin-top: 24px;">
        <a href="${disableUrl}" style="background: #2EC5F0; color: #0A0A0F; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Disable Two-Factor Authentication
        </a>
      </p>
      <p style="margin-top: 16px; color: #888; font-size: 12px;">
        You'll need to confirm your email and password again on that page. This link expires in 30 minutes.
        Once disabled, you can set up two-factor authentication again anytime from your Security page.
      </p>
      <p style="margin-top: 16px; color: #888; font-size: 12px;">If you did not request this, contact the Founder immediately.</p>
    </div>
  `;

  const result = await sendNotificationEmail({
    toEmail,
    toName,
    subject: "Disable your two-factor authentication",
    htmlContent,
  });

  if (!result.success) {
    console.error("Failed to send 2FA recovery email:", result.error);
  }
}
