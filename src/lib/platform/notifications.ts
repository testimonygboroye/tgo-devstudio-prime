import { connectToDatabase } from "@/lib/db";
import PlatformNotification from "@/models/PlatformNotification";
import type { Types } from "mongoose";

export interface CreatePlatformNotificationInput {
  recipientId: string | Types.ObjectId;
  category: string;
  title: string;
  body: string;
  href?: string;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
}

export async function createPlatformNotification(input: CreatePlatformNotificationInput) {
  await connectToDatabase();
  const safeHref =
    input.href && input.href.startsWith("/") && !input.href.startsWith("//")
      ? input.href
      : undefined;

  if (input.dedupeKey) {
    return PlatformNotification.findOneAndUpdate(
      { recipientId: input.recipientId, dedupeKey: input.dedupeKey },
      {
        $setOnInsert: {
          ...input,
          href: safeHref,
          metadata: input.metadata || {},
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return PlatformNotification.create({
    ...input,
    href: safeHref,
    metadata: input.metadata || {},
  });
}
