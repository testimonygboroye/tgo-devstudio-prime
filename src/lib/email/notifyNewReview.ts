import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface NotifyNewReviewParams {
  submitterName: string;
  rating: number;
  targetLabel: string;
  reviewId: string;
}

export async function notifyNewReview({
  submitterName,
  rating,
  targetLabel,
  reviewId,
}: NotifyNewReviewParams): Promise<void> {
  const founderEmail = process.env.FOUNDER_NOTIFICATION_EMAIL;
  if (!founderEmail) {
    console.error("Review notification skipped: FOUNDER_NOTIFICATION_EMAIL not configured.");
    return;
  }

  const adminPath = process.env.ADMIN_PATH || "command-deck";
  const siteUrl = process.env.SITE_URL || "";
  const reviewUrl = `${siteUrl}/${adminPath}/reviews/${reviewId}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">New Review Pending Moderation</h2>
      <p><strong>${submitterName}</strong> left a ${rating}-star review about: <strong>${targetLabel}</strong></p>
      <p style="margin-top: 24px;">
        <a href="${reviewUrl}" style="background: #2EC5F0; color: #0A0A0F; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Moderate Review
        </a>
      </p>
    </div>
  `;

  const result = await sendNotificationEmail({
    toEmail: founderEmail,
    subject: `New Review Pending: ${submitterName} (${rating}★)`,
    htmlContent,
  });

  if (!result.success) {
    console.error("Failed to send review notification email:", result.error);
  }
}
