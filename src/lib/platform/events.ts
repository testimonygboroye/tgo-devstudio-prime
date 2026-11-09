import { connectToDatabase } from "@/lib/db";
import PlatformEvent from "@/models/PlatformEvent";

export interface EnqueuePlatformEventInput {
  eventName: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  availableAt?: Date;
}

export async function enqueuePlatformEvent(input: EnqueuePlatformEventInput) {
  await connectToDatabase();

  if (input.idempotencyKey) {
    return PlatformEvent.findOneAndUpdate(
      { idempotencyKey: input.idempotencyKey },
      {
        $setOnInsert: {
          ...input,
          status: "pending",
          attempts: 0,
          availableAt: input.availableAt || new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return PlatformEvent.create({
    ...input,
    status: "pending",
    attempts: 0,
    availableAt: input.availableAt || new Date(),
  });
}
