import { Schema, model, models, Document, Model, Types } from "mongoose";

export type EmploymentType = "full-time" | "part-time" | "contract" | "internship" | "freelance";
export type LocationType = "remote" | "onsite" | "hybrid";
export type PublishStatus = "draft" | "published";

export interface IJobOpening extends Document {
  title: string;
  slug: string;
  department?: string;
  locationType: LocationType;
  employmentType: EmploymentType;
  summary: string;
  responsibilities: string;
  requirements: string;
  applyEmail?: string;
  applyUrl?: string;
  publishStatus: PublishStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobOpeningSchema = new Schema<IJobOpening>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String, trim: true },
    locationType: { type: String, enum: ["remote", "onsite", "hybrid"], default: "remote" },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "freelance"],
      default: "full-time",
    },
    summary: { type: String, required: true, trim: true, maxlength: 250 },
    responsibilities: { type: String, default: "", maxlength: 2000 },
    requirements: { type: String, default: "", maxlength: 2000 },
    applyEmail: { type: String },
    applyUrl: { type: String },
    publishStatus: { type: String, enum: ["draft", "published"], default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const JobOpening: Model<IJobOpening> =
  models.JobOpening || model<IJobOpening>("JobOpening", JobOpeningSchema);

export default JobOpening;
