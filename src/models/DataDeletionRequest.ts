import { Schema, model, models, Document, Model, Types } from "mongoose";

export type DataDeletionStatus = "received" | "verification_required" | "verified" | "in_progress" | "completed" | "partially_retained" | "rejected";
export interface IDataDeletionRequest extends Document {
  reference: string;
  name: string;
  email: string;
  accountIdentifier: string;
  service: string;
  details: string;
  status: DataDeletionStatus;
  verificationNote: string;
  resolutionNote: string;
  verifiedAt?: Date;
  resolvedAt?: Date;
  handledBy?: Types.ObjectId;
  lookupCount: number;
  lookupWindowStartedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IDataDeletionRequest>({
  reference: { type: String, required: true, unique: true, maxlength: 40 },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, index: true },
  accountIdentifier: { type: String, required: true, trim: true, maxlength: 180 },
  service: { type: String, required: true, enum: ["website", "client-portal", "whatsapp", "other"] },
  details: { type: String, required: true, trim: true, maxlength: 3000 },
  status: { type: String, enum: ["received", "verification_required", "verified", "in_progress", "completed", "partially_retained", "rejected"], default: "received", index: true },
  verificationNote: { type: String, default: "", maxlength: 2000 },
  resolutionNote: { type: String, default: "", maxlength: 3000 },
  verifiedAt: Date,
  resolvedAt: Date,
  handledBy: { type: Schema.Types.ObjectId, ref: "User" },
  lookupCount: { type: Number, default: 0, min: 0 },
  lookupWindowStartedAt: Date,
}, { timestamps: true });
schema.index({ status: 1, createdAt: -1 });
const DataDeletionRequest: Model<IDataDeletionRequest> = models.DataDeletionRequest || model<IDataDeletionRequest>("DataDeletionRequest", schema);
export default DataDeletionRequest;
