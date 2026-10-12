import mongoose, { Schema, type Model } from "mongoose";

export interface IPushSubscription {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceLabel?: string;
  userAgent?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    expirationTime: {
      type: Number,
      default: null,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    deviceLabel: { type: String, maxlength: 120 },
    userAgent: { type: String, maxlength: 500 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

PushSubscriptionSchema.index({ userId: 1, active: 1 });

const PushSubscription: Model<IPushSubscription> =
  (mongoose.models.PushSubscription as Model<IPushSubscription>) ||
  mongoose.model<IPushSubscription>(
    "PushSubscription",
    PushSubscriptionSchema
  );

export default PushSubscription;
