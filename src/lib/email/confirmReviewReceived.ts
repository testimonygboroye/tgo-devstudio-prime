import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface ConfirmReviewReceivedParams {
  submitterName: string;
  submitterEmail: string;
}

export async function confirmReviewReceived({
  submitterName,
  submitterEmail,
}: ConfirmReviewReceivedParams): Promise<void> {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">Thanks for Your Feedback</h2>
      <p>Hi ${submitterName},</p>
      <p>We've received your review and it's currently being reviewed by our team.
      Once approved, it may appear on our Testimonials page.</p>
      <p style="margin-top: 24px; color: #888;">— The TGO DevStudio Team</p>
    </div>
  `;

  const result = await sendNotificationEmail({
    toEmail: submitterEmail,
    toName: submitterName,
    subject: "We received your feedback",
    htmlContent,
  });

  if (!result.success) {
    console.error("Failed to send review confirmation email:", result.error);
  }
}
