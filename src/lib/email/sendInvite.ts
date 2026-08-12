import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface SendInviteEmailParams {
  toEmail: string;
  roleName: string;
  inviteUrl: string;
}

export async function sendInviteEmail({ toEmail, roleName, inviteUrl }: SendInviteEmailParams): Promise<void> {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">You've Been Invited</h2>
      <p>You've been invited to join the TGO DevStudio Prime admin panel as <strong>${roleName}</strong>.</p>
      <p style="margin-top: 24px;">
        <a href="${inviteUrl}" style="background: #2EC5F0; color: #0A0A0F; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Accept Invite
        </a>
      </p>
      <p style="margin-top: 16px; color: #888; font-size: 12px;">This invite link expires in 7 days.</p>
    </div>
  `;

  const result = await sendNotificationEmail({
    toEmail,
    subject: "You're invited to TGO DevStudio Prime",
    htmlContent,
  });

  if (!result.success) {
    console.error("Failed to send invite email:", result.error);
  }
}
