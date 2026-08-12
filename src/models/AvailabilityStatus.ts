import { Schema, model, models, Document, Types } from "mongoose";
import type { Model } from "mongoose";

export type AvailabilityState = "accepting" | "limited" | "booked";

export interface IAvailabilityStatus extends Document {
  state: AvailabilityState;
  customMessage?: string;
  lastUpdatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilityStatusSchema = new Schema<IAvailabilityStatus>(
  {
    state: { type: String, enum: ["accepting", "limited", "booked"], required: true, default: "accepting" },
    customMessage: { type: String, trim: true, maxlength: 150 },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const AvailabilityStatus: Model<IAvailabilityStatus> =
  models.AvailabilityStatus || model<IAvailabilityStatus>("AvailabilityStatus", AvailabilityStatusSchema);

export default AvailabilityStatus;
