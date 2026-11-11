import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import MarketingCampaign from "@/models/MarketingCampaign";
import MarketingCampaignDelivery from "@/models/MarketingCampaignDelivery";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { sendNotificationEmail } from "@/lib/email/sendEmail";
import { generateUnsubscribeToken } from "@/lib/newsletter/unsubscribeToken";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c); }

export async function GET(request: NextRequest) {
  const secret = process.env.PLATFORM_AUTOMATION_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Campaign worker is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== "Bearer " + secret) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const base = (process.env.APP_BASE_URL || process.env.SITE_URL || "").replace(/\/$/, "");
  if (!base) return NextResponse.json({ error: "APP_BASE_URL or SITE_URL is required for unsubscribe links." }, { status: 503 });
  await connectToDatabase();
  const campaigns = await MarketingCampaign.find({ status: { $in: ["queued", "sending"] }, channel: "email", audience: "newsletter_subscribers", $or: [{ scheduledAt: { $exists: false } }, { scheduledAt: null }, { scheduledAt: { $lte: new Date() } }] }).sort({ updatedAt: 1 }).limit(10);
  let sent = 0, failed = 0, processed = 0;
  for (const campaign of campaigns) {
    await MarketingCampaignDelivery.updateMany({ campaignId: campaign._id, status: "sending", updatedAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) } }, { $set: { status: "pending", lastError: "Recovered interrupted campaign delivery." } });
    campaign.status = "sending"; await campaign.save();
    const jobs = await MarketingCampaignDelivery.find({ campaignId: campaign._id, status: "pending", attempts: { $lt: 3 } }).sort({ createdAt: 1 }).limit(25).lean();
    for (const job of jobs) {
      const claim = await MarketingCampaignDelivery.findOneAndUpdate({ _id: job._id, status: "pending", attempts: { $lt: 3 } }, { $set: { status: "sending" }, $inc: { attempts: 1 } }, { new: true });
      if (!claim) continue;
      processed++;
      const subscriber = await NewsletterSubscriber.findOne({ _id: job.subscriberId, status: "subscribed" }).select("_id email").lean();
      if (!subscriber) {
        await MarketingCampaignDelivery.updateOne({ _id: job._id }, { $set: { status: "failed", lastError: "Recipient is no longer subscribed." } }); failed++; continue;
      }
      try {
        const token = generateUnsubscribeToken(String(subscriber._id));
        const unsubscribeUrl = base + "/unsubscribe/" + subscriber._id + "?token=" + encodeURIComponent(token);
        const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;white-space:pre-wrap">${escapeHtml(campaign.content)}</div><hr/><p style="font-size:12px;color:#777">You are receiving this because you subscribed to TGO DevStudio updates. <a href="${unsubscribeUrl}">Unsubscribe</a></p>`;
        const result = await sendNotificationEmail({ toEmail: subscriber.email, subject: campaign.subject, htmlContent: html });
        if (result.success) {
          await MarketingCampaignDelivery.updateOne({ _id: job._id }, { $set: { status: "sent", sentAt: new Date(), lastError: "" } }); sent++;
        } else {
          await MarketingCampaignDelivery.updateOne({ _id: job._id }, { $set: { status: claim.attempts >= 3 ? "failed" : "pending", lastError: (result.error || "Delivery failed.").slice(0, 500) } }); failed++;
        }
      } catch (error) {
        await MarketingCampaignDelivery.updateOne({ _id: job._id }, { $set: { status: claim.attempts >= 3 ? "failed" : "pending", lastError: (error instanceof Error ? error.message : "Delivery failed.").slice(0, 500) } }); failed++;
      }
    }
    const [pending, sending, sentTotal, failedTotal] = await Promise.all([
      MarketingCampaignDelivery.countDocuments({ campaignId: campaign._id, status: "pending" }),
      MarketingCampaignDelivery.countDocuments({ campaignId: campaign._id, status: "sending" }),
      MarketingCampaignDelivery.countDocuments({ campaignId: campaign._id, status: "sent" }),
      MarketingCampaignDelivery.countDocuments({ campaignId: campaign._id, status: "failed" }),
    ]);
    if (pending === 0 && sending === 0) {
      campaign.status = failedTotal > 0 ? "failed" : "sent"; await campaign.save();
      await writePlatformAuditEvent({ actorType: "system", actorId: "marketing-campaign-worker", actorLabel: "Marketing campaign worker", action: "marketing_campaign.delivery_completed", module: "marketing", targetType: "MarketingCampaign", targetId: String(campaign._id), outcome: failedTotal > 0 ? "failure" : "success", metadata: { sent: sentTotal, failed: failedTotal } });
    }
  }
  return NextResponse.json({ ok: true, campaignsScanned: campaigns.length, processed, sent, failed });
}
