import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface NotifyNewApplicationParams {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  applicationId: string;
}

export async function notifyNewApplication({
  applicantName,
  applicantEmail,
  jobTitle,
  applicationId,
}: NotifyNewApplicationParams): Promise<void> {
  const founderEmail = process.env.FOUNDER_NOTIFICATION_EMAIL;
  if (!founderEmail) {
    console.error("Application notification skipped: FOUNDER_NOTIFICATION_EMAIL not configured.");
    return;
  }

  const adminPath = process.env.ADMIN_PATH || "command-deck";
  const siteUrl = process.env.SITE_URL || "";
  const applicationUrl = `${siteUrl}/${adminPath}/applications/${applicationId}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">New Job Application</h2>
      <p><strong>${applicantName}</strong> (${applicantEmail}) applied for <strong>${jobTitle}</strong>.</p>
      <p style="margin-top: 24px;">
        <a href="${applicationUrl}" style="background: #2EC5F0; color: #0A0A0F; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          View Application
        </a>
      </p>
    </div>
  `;

  const result = await sendNotificationEmail({
    toEmail: founderEmail,
    subject: `New Application: ${jobTitle} — ${applicantName}`,
    htmlContent,
  });

  if (!result.success) {
    console.error("Failed to send application notification email:", result.error);
  }
}
