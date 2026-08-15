import { sendNotificationEmail } from "@/lib/email/sendEmail";

interface Params {
  toEmail: string;
  toName: string;
  subject: string;
  message: string;
}

export async function sendAccountStatusChangeEmail({ toEmail, toName, subject, message }: Params): Promise<void> {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C3CE9;">${subject}</h2>
      <p>Hi ${toName},</p>
      <p>${message}</p>
    </div>
  `;
  const result = await sendNotificationEmail({ toEmail, toName, subject, htmlContent });
  if (!result.success) {
    console.error("Failed to send account status change email:", result.error);
  }
}
