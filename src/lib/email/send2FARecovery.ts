import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface Params {
  toEmail: string;
  toName: string;
  secret: string;
  backupCodes: string[];
}

export async function send2FARecoveryEmail({ toEmail, toName, secret, backupCodes }: Params): Promise<void> {
  const codesHtml = backupCodes.map((c) => `<li style="font-family: monospace;">${c}</li>`).join("");

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">Two-Factor Authentication Reset</h2>
      <p>Hi ${toName},</p>
      <p>Your two-factor authentication has been reset as requested. Your old authenticator entry and backup codes no longer work.</p>
      <p><strong>New Secret Key (enter manually in your authenticator app):</strong></p>
      <p style="font-family: monospace; background: #111; color: #2EC5F0; padding: 10px; border-radius: 6px;">${secret}</p>
      <p><strong>New Backup Codes</strong> (each works once, save them somewhere safe):</p>
      <ul>${codesHtml}</ul>
      <p style="margin-top: 16px; color: #888; font-size: 12px;">If you did not request this, contact the Founder immediately.</p>
    </div>
  `;

  const result = await sendNotificationEmail({
    toEmail,
    toName,
    subject: "Your two-factor authentication has been reset",
    htmlContent,
  });

  if (!result.success) {
    console.error("Failed to send 2FA recovery email:", result.error);
  }
}
