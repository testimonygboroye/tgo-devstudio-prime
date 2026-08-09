import { NextRequest, NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/email/sendEmail";

export async function GET(request: NextRequest) {
  const providedSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  const founderEmail = process.env.FOUNDER_NOTIFICATION_EMAIL;
  if (!founderEmail) {
    return NextResponse.json(
      { status: "error", message: "FOUNDER_NOTIFICATION_EMAIL not configured." },
      { status: 500 }
    );
  }

  const result = await sendNotificationEmail({
    toEmail: founderEmail,
    subject: "TGO DevStudio Prime — Weekly System Check",
    htmlContent: `
      <div style="font-family: sans-serif;">
        <p>This is an automated weekly check-in from TGO DevStudio Prime.</p>
        <p>It keeps the Brevo email service active and confirms the notification
        pipeline is still working correctly. No action needed.</p>
        <p style="color:#888; font-size:12px;">Sent: ${new Date().toISOString()}</p>
      </div>
    `,
  });

  if (!result.success) {
    return NextResponse.json({ status: "error", message: result.error }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", message: "Keep-alive email sent." });
}
