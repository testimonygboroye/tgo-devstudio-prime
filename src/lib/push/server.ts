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

  let sent = 0, removed = 0, failed = 0, cursor = 0;
  const worker = async () => {
    while (cursor < subscriptions.length) {
      const subscription = subscriptions[cursor++];
      let complete = false;
      for (let attempt = 0; attempt < 3 && !complete; attempt++) {
        try {
          await webpush.sendNotification(
            { endpoint: subscription.endpoint, expirationTime: subscription.expirationTime ?? null, keys: subscription.keys },
            JSON.stringify(notification),
            { TTL: 60 * 60 * 24 * 7, urgency: "high" },
          );
          sent++; complete = true;
        } catch (error: unknown) {
          const code = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
          if (code === 404 || code === 410) {
            await PushSubscription.deleteOne({ _id: subscription._id }); removed++; complete = true;
          } else if ((code === 0 || code === 429 || code >= 500) && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 250 * (2 ** attempt)));
          } else {
            failed++; console.error("[Push] Delivery failed:", code || "unknown"); complete = true;
          }
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, subscriptions.length) }, () => worker()));
  return { sent, removed, failed };
}
