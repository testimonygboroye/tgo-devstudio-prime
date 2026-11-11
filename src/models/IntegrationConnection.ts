import { Schema, model, models, Document, Model } from "mongoose";

export type IntegrationStatus = "configured" | "connected" | "error" | "disconnected";
export interface IIntegrationConnection extends Document {
  providerId: string;
  displayName: string;
  category: string;
  status: IntegrationStatus;
  credentialsCiphertext: string;
  credentialNames: string[];
  lastVerifiedAt?: Date;
  lastError?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IIntegrationConnection>({
  providerId: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
  displayName: { type: String, required: true, maxlength: 120 },
  category: { type: String, required: true, maxlength: 60 },
  status: { type: String, enum: ["configured", "connected", "error", "disconnected"], default: "configured", index: true },
  credentialsCiphertext: { type: String, required: true, select: false },
  credentialNames: { type: [String], default: [] },
  lastVerifiedAt: Date,
  lastError: { type: String, maxlength: 300, default: "" },
  createdBy: { type: String, required: true, maxlength: 100 },
  updatedBy: { type: String, required: true, maxlength: 100 },
}, { timestamps: true });
schema.index({ category: 1, status: 1 });
const IntegrationConnection: Model<IIntegrationConnection> = models.IntegrationConnection || model<IIntegrationConnection>("IntegrationConnection", schema);
export default IntegrationConnection;
