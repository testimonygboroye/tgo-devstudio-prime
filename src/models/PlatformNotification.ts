import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IPlatformNotification extends Document {
  recipientId: Types.ObjectId;
  category: string;
  title: string;
  body: string;
  href?: string;
  readAt?: Date;
  dedupeKey?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const PlatformNotificationSchema = new Schema<IPlatformNotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    body: { type: String, required: true, trim: true, maxlength: 1200 },
    href: { type: String, maxlength: 500 },
    readAt: Date,
    dedupeKey: { type: String, maxlength: 200 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PlatformNotificationSchema.index({ recipientId: 1, createdAt: -1 });
PlatformNotificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });
PlatformNotificationSchema.index(
  { recipientId: 1, dedupeKey: 1 },
  { unique: true, sparse: true }
);

const PlatformNotification: Model<IPlatformNotification> =
  models.PlatformNotification ||
  model<IPlatformNotification>("PlatformNotification", PlatformNotificationSchema);

export default PlatformNotification;
