import { Schema, model, models, Document, Model } from "mongoose";

export interface IPlatformEvent extends Document {
  eventName: string;
  eventVersion: number;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  status: "pending" | "processing" | "published" | "failed";
  attempts: number;
  availableAt: Date;
  lockedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformEventSchema = new Schema<IPlatformEvent>(
  {
    eventName: { type: String, required: true, trim: true, maxlength: 160 },
    eventVersion: { type: Number, default: 1, min: 1 },
    aggregateType: { type: String, required: true, maxlength: 100 },
    aggregateId: { type: String, required: true, maxlength: 160 },
    payload: { type: Schema.Types.Mixed, required: true, default: {} },
    idempotencyKey: { type: String, maxlength: 200 },
    status: {
      type: String,
      enum: ["pending", "processing", "published", "failed"],
      default: "pending",
      required: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    availableAt: { type: Date, default: Date.now },
    lockedAt: Date,
    lastError: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

PlatformEventSchema.index({ status: 1, availableAt: 1, createdAt: 1 });
PlatformEventSchema.index({ aggregateType: 1, aggregateId: 1, createdAt: -1 });
PlatformEventSchema.index(
  { idempotencyKey: 1 },
  { unique: true, sparse: true }
);

const PlatformEvent: Model<IPlatformEvent> =
  models.PlatformEvent || model<IPlatformEvent>("PlatformEvent", PlatformEventSchema);

export default PlatformEvent;
