import { Schema, model, models, Document, Model, Types } from "mongoose";
import { REVIEW_TARGET_TYPES, ReviewTargetType } from "@/lib/constants/reviewTargets";

export type ReviewStatus = "pending" | "approved" | "rejected";
export type ModerationAction = "approved" | "rejected" | "edited" | "deleted";

export interface IModerationLogEntry {
  action: ModerationAction;
  performedByName: string;
  timestamp: Date;
  note?: string;
}

export interface IReview extends Document {
  submitterName: string;
  submitterEmail: string;
  rating: number;
  body: string;
  targetType: ReviewTargetType;
  targetId?: Types.ObjectId;
  targetModel?: string;
  targetLabelSnapshot?: string;
  customLabel?: string;
  status: ReviewStatus;
  featured: boolean;
  featuredOnHomepage: boolean;
  moderationHistory: IModerationLogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const ModerationLogSchema = new Schema<IModerationLogEntry>(
  {
    action: { type: String, enum: ["approved", "rejected", "edited", "deleted"], required: true },
    performedByName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReview>(
  {
    submitterName: { type: String, required: true, trim: true, maxlength: 150 },
    submitterEmail: { type: String, required: true, trim: true, lowercase: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    targetType: { type: String, enum: REVIEW_TARGET_TYPES, required: true, default: "general" },
    targetId: { type: Schema.Types.ObjectId, refPath: "targetModel" },
    targetModel: {
      type: String,
      enum: ["Project", "TeamMember", "BlogPost", "JobOpening", "Review"],
    },
    targetLabelSnapshot: { type: String, trim: true, maxlength: 200 },
    customLabel: { type: String, trim: true, maxlength: 200 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    featured: { type: Boolean, default: false },
    featuredOnHomepage: { type: Boolean, default: false },
    moderationHistory: { type: [ModerationLogSchema], default: [] },
  },
  { timestamps: true }
);

const Review: Model<IReview> = models.Review || model<IReview>("Review", ReviewSchema);
export default Review;
