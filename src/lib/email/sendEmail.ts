const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface SendEmailParams {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}

export async function sendNotificationEmail({
  toEmail,
  toName,
  subject,
  htmlContent,
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    console.error("Brevo email skipped: BREVO_API_KEY or BREVO_SENDER_EMAIL not configured.");
    return { success: false, error: "Email service not configured." };
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: "TGO DevStudio Prime" },
        to: [{ email: toEmail, name: toName || toEmail }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Brevo email send failed:", response.status, errorBody);
      return { success: false, error: `Brevo API error: ${response.status}` };
    }

    return { success: true };
  } catch (err) {
    console.error("Brevo email send threw an error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error." };
  }
}
