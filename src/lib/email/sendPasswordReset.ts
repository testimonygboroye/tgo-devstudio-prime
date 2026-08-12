import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface SendPasswordResetEmailParams {
  toEmail: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ toEmail, resetUrl }: SendPasswordResetEmailParams): Promise<void> {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">Reset Your Password</h2>
      <p>We received a request to reset your password for TGO DevStudio Prime.</p>
      <p style="margin-top: 24px;">
        <a href="${resetUrl}" style="background: #2EC5F0; color: #0A0A0F; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p style="margin-top: 16px; color: #888; font-size: 12px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  const result = await sendNotificationEmail({
    toEmail,
    subject: "Reset your TGO DevStudio Prime password",
    htmlContent,
  });

  if (!result.success) {
    console.error("Failed to send password reset email:", result.error);
  }
}
