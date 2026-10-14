import mongoose, { Schema, type Model } from "mongoose";

export interface IPushAnalyticsSnapshot {
  snapshotDate: string;
  uniqueVisitorCount: number;
  averageDailyVisitors: number;
  peakDailyVisitors: number;
  peakDay?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PushAnalyticsSnapshotSchema = new Schema<IPushAnalyticsSnapshot>(
  {
    snapshotDate: { type: String, required: true, unique: true, index: true },
    uniqueVisitorCount: { type: Number, required: true, default: 0 },
    averageDailyVisitors: { type: Number, required: true, default: 0 },
    peakDailyVisitors: { type: Number, required: true, default: 0 },
    peakDay: { type: String, default: null },
  },
  { timestamps: true }
);

const PushAnalyticsSnapshot: Model<IPushAnalyticsSnapshot> =
  (mongoose.models.PushAnalyticsSnapshot as Model<IPushAnalyticsSnapshot>) ||
  mongoose.model<IPushAnalyticsSnapshot>(
    "PushAnalyticsSnapshot",
    PushAnalyticsSnapshotSchema
  );

export default PushAnalyticsSnapshot;
