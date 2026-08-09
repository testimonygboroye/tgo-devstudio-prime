import { Schema, model, models, Document, Model } from "mongoose";

export type ContactStatus = "new" | "read" | "replied" | "archived";
export type ContactSubject = "general" | "project" | "careers" | "other";

export interface IContactSubmission extends Document {
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSubmissionSchema = new Schema<IContactSubmission>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: {
      type: String,
      enum: ["general", "project", "careers", "other"],
      default: "general",
    },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: {
      type: String,
      enum: ["new", "read", "replied", "archived"],
      default: "new",
    },
  },
  { timestamps: true }
);

const ContactSubmission: Model<IContactSubmission> =
  models.ContactSubmission || model<IContactSubmission>("ContactSubmission", ContactSubmissionSchema);

export default ContactSubmission;
