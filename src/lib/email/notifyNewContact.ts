import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface NotifyNewContactParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  submissionId: string;
}

export async function notifyNewContact({
  name,
  email,
  subject,
  message,
  submissionId,
}: NotifyNewContactParams): Promise<void> {
  const founderEmail = process.env.FOUNDER_NOTIFICATION_EMAIL;
  if (!founderEmail) {
    console.error("Contact notification skipped: FOUNDER_NOTIFICATION_EMAIL not configured.");
    return;
  }

  const adminPath = process.env.ADMIN_PATH || "command-deck";
  const siteUrl = process.env.SITE_URL || "";
  const submissionUrl = `${siteUrl}/${adminPath}/contact/${submissionId}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">New Contact Message</h2>
      <p><strong>${name}</strong> (${email}) — topic: ${subject}</p>
      <p style="margin-top: 12px; white-space: pre-wrap;">${message}</p>
      <p style="margin-top: 24px;">
        <a href="${submissionUrl}" style="background: #2EC5F0; color: #0A0A0F; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          View in Admin
        </a>
      </p>
    </div>
  `;

  const result = await sendNotificationEmail({
    toEmail: founderEmail,
    subject: `New Contact Message: ${name}`,
    htmlContent,
  });

  if (!result.success) {
    console.error("Failed to send contact notification email:", result.error);
  }
}
