import webpush from "web-push";
import { connectToDatabase } from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";
import type { AdminPushNotification } from "./types";

let vapidConfigured = false;

function configureVapid(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    console.error("[Push] VAPID configuration is incomplete.");
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  return key || null;
}

export async function sendAdminPush(
  notification: AdminPushNotification,
  userId?: string
): Promise<{ sent: number; removed: number; failed: number }> {
  if (!configureVapid()) {
    return { sent: 0, removed: 0, failed: 0 };
  }

  await connectToDatabase();

  const filter: Record<string, unknown> = { active: true };
  if (userId) filter.userId = userId;

  const subscriptions = await PushSubscription.find(filter).lean();

  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          expirationTime: subscription.expirationTime ?? null,
          keys: subscription.keys,
        },
        JSON.stringify(notification),
        { TTL: 60 * 60 }
      );
      sent++;
    } catch (error: unknown) {
      const statusCode =
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error
          ? Number(error.statusCode)
          : 0;

      if (statusCode === 404 || statusCode === 410) {
        await PushSubscription.deleteOne({ _id: subscription._id });
        removed++;
      } else {
        failed++;
        console.error("[Push] Delivery failed:", statusCode || "unknown");
      }
    }
  }

  return { sent, removed, failed };
}
