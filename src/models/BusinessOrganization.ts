import { Schema, model, models, Document, Model, Types } from "mongoose";

export type BusinessOrganizationType = "internal" | "client" | "partner" | "vendor";
export type BusinessOrganizationStatus = "active" | "suspended";

export interface IBusinessOrganization extends Document {
  name: string;
  slug: string;
  type: BusinessOrganizationType;
  status: BusinessOrganizationStatus;
  website?: string;
  contactEmail?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessOrganizationSchema = new Schema<IBusinessOrganization>({
  name: { type: String, required: true, trim: true, maxlength: 140 },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  type: { type: String, enum: ["internal", "client", "partner", "vendor"], required: true, default: "client" },
  status: { type: String, enum: ["active", "suspended"], required: true, default: "active" },
  website: { type: String, trim: true, maxlength: 300 },
  contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
  notes: { type: String, trim: true, maxlength: 2000 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

BusinessOrganizationSchema.index({ slug: 1 }, { unique: true });
BusinessOrganizationSchema.index({ status: 1, type: 1, createdAt: -1 });
BusinessOrganizationSchema.index({ name: "text", slug: "text" });

const BusinessOrganization: Model<IBusinessOrganization> =
  models.BusinessOrganization || model<IBusinessOrganization>("BusinessOrganization", BusinessOrganizationSchema);

export default BusinessOrganization;
