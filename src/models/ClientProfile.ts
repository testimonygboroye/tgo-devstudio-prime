import { Schema, model, models, Document, Model, Types } from "mongoose";

export type ClientLifecycle = "lead" | "onboarding" | "active" | "at_risk" | "inactive";

export interface IClientProfile extends Document {
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  phone?: string;
  phoneVerifiedAt?: Date;
  jobTitle?: string;
  website?: string;
  country?: string;
  timezone?: string;
  lifecycle: ClientLifecycle;
  segments: string[];
  onboardingStatus: "not_started" | "in_progress" | "completed";
  source: "self_registration" | "admin_created" | "google";
  assignedTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClientProfileSchema = new Schema<IClientProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "BusinessOrganization" },
  phone: { type: String, trim: true, maxlength: 40 },
  phoneVerifiedAt: { type: Date },
  jobTitle: { type: String, trim: true, maxlength: 120 },
  website: { type: String, trim: true, maxlength: 300 },
  country: { type: String, trim: true, maxlength: 100 },
  timezone: { type: String, trim: true, maxlength: 80 },
  lifecycle: { type: String, enum: ["lead", "onboarding", "active", "at_risk", "inactive"], default: "onboarding" },
  segments: { type: [String], default: [], validate: [(v: string[]) => v.length <= 30, "Maximum 30 segments"] },
  onboardingStatus: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started" },
  source: { type: String, enum: ["self_registration", "admin_created", "google"], required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

ClientProfileSchema.index({ lifecycle: 1, updatedAt: -1 });
ClientProfileSchema.index({ organizationId: 1, lifecycle: 1 });

const ClientProfile: Model<IClientProfile> = models.ClientProfile || model<IClientProfile>("ClientProfile", ClientProfileSchema);
export default ClientProfile;
