import { Schema, model, models, Document, Model, Types } from "mongoose";

export type ApplicationStatus = "new" | "reviewed" | "shortlisted" | "rejected" | "hired";

export interface IJobApplication extends Document {
  jobOpening: Types.ObjectId;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  coverMessage: string;
  profilePhotoUrl: string;
  resumeUrl: string;
  resumePublicId: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>(
  {
    jobOpening: { type: Schema.Types.ObjectId, ref: "JobOpening", required: true },
    applicantName: { type: String, required: true, trim: true, maxlength: 150 },
    applicantEmail: { type: String, required: true, trim: true, lowercase: true },
    applicantPhone: { type: String, trim: true },
    coverMessage: { type: String, required: true, maxlength: 3000 },
    profilePhotoUrl: { type: String, required: true },
    resumeUrl: { type: String, required: true },
    resumePublicId: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "reviewed", "shortlisted", "rejected", "hired"],
      default: "new",
    },
  },
  { timestamps: true }
);

const JobApplication: Model<IJobApplication> =
  models.JobApplication || model<IJobApplication>("JobApplication", JobApplicationSchema);

export default JobApplication;
