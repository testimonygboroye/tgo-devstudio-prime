import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface Params {
  toEmail: string;
  toName: string;
  currentRoleName: string;
  requestedRoleName: string;
  reviewUrl: string;
}

export async function sendRoleChangeRequestEmail({
  toEmail,
  toName,
  currentRoleName,
  requestedRoleName,
  reviewUrl,
}: Params): Promise<void> {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">Role Change Request</h2>
      <p>Hi ${toName},</p>
      <p>You've been offered a role change from <strong>${currentRoleName}</strong> to <strong>${requestedRoleName}</strong>.</p>
      <p>This change requires your acceptance before it takes effect.</p>
      <p style="margin-top: 24px;">
        <a href="${reviewUrl}" style="background: #2EC5F0; color: #0A0A0F; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Review Request
        </a>
      </p>
    </div>
  `;

  const result = await sendNotificationEmail({
    toEmail,
    toName,
    subject: `Role change offered: ${requestedRoleName}`,
    htmlContent,
  });

  if (!result.success) {
    console.error("Failed to send role change request email:", result.error);
  }
}
