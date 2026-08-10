import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface ConfirmContactReceivedParams {
  name: string;
  email: string;
}

export async function confirmContactReceived({
  name,
  email,
}: ConfirmContactReceivedParams): Promise<void> {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">We Got Your Message</h2>
      <p>Hi ${name},</p>
      <p>Thanks for reaching out to TGO DevStudio. We've received your message
      and will get back to you as soon as we can.</p>
      <p style="margin-top: 24px; color: #888;">— The TGO DevStudio Team</p>
    </div>
  `;

  const result = await sendNotificationEmail({
    toEmail: email,
    toName: name,
    subject: "We received your message",
    htmlContent,
  });

  if (!result.success) {
    console.error("Failed to send contact confirmation email:", result.error);
  }
}
