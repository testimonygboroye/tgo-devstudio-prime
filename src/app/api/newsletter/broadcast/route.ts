import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireContentPermission } from "@/lib/auth/authorize";
import { sendNotificationEmail } from "@/lib/email/sendEmail";
import { generateUnsubscribeToken } from "@/lib/newsletter/unsubscribeToken";

const CONTENT_TYPE = "newsletterSubscribers";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();
  if (!requireContentPermission(session, CONTENT_TYPE, "publish")) {
    return forbiddenResponse("You do not have permission to send newsletter broadcasts.");
  }

  const body = await request.json();
  const { subject, bodyHtml } = body as { subject?: string; bodyHtml?: string };

  if (!subject || !bodyHtml) {
    return NextResponse.json({ status: "error", message: "Subject and content are required." }, { status: 400 });
  }

  await connectToDatabase();

  const subscribers = await NewsletterSubscriber.find({ status: "subscribed" }).select("_id email").lean();

  if (subscribers.length === 0) {
    return NextResponse.json({ status: "error", message: "No active subscribers to send to." }, { status: 400 });
  }

  const siteUrl = process.env.SITE_URL || "";
  let sentCount = 0;
  let failedCount = 0;

  for (const subscriber of subscribers) {
    const token = generateUnsubscribeToken(subscriber._id.toString());
    const unsubscribeUrl = `${siteUrl}/unsubscribe/${subscriber._id}?token=${token}`;

    const fullHtml = `
      ${bodyHtml}
      <hr style="margin-top: 32px; border-color: #333;" />
      <p style="font-size: 12px; color: #888; margin-top: 16px;">
        You're receiving this because you subscribed to TGO DevStudio's newsletter.
        <a href="${unsubscribeUrl}" style="color: #2EC5F0;">Unsubscribe</a>
      </p>
    `;

    const result = await sendNotificationEmail({
      toEmail: subscriber.email,
      subject,
      htmlContent: fullHtml,
    });

    if (result.success) {
      sentCount++;
    } else {
      failedCount++;
    }
  }

  return NextResponse.json({
    status: "ok",
    message: `Broadcast sent to ${sentCount} subscriber(s). ${failedCount > 0 ? `${failedCount} failed.` : ""}`,
  });
}
