import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface ConfirmApplicationReceivedParams {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
}

export async function confirmApplicationReceived({
  applicantName,
  applicantEmail,
  jobTitle,
}: ConfirmApplicationReceivedParams): Promise<void> {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">Application Received</h2>
      <p>Hi ${applicantName},</p>
      <p>Thanks for applying for <strong>${jobTitle}</strong> at TGO DevStudio.
      We've received your application and will review it carefully.</p>
      <p>If your background is a good fit, we'll reach out to you directly at
      this email address.</p>
      <p style="margin-top: 24px; color: #888;">— The TGO DevStudio Team</p>
    </div>
  `;

  const result = await sendNotificationEmail({
    toEmail: applicantEmail,
    toName: applicantName,
    subject: `We received your application: ${jobTitle}`,
    htmlContent,
  });

  if (!result.success) {
    console.error("Failed to send applicant confirmation email:", result.error);
  }
}
