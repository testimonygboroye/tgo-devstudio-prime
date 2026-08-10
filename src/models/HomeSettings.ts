import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IHomeSettings extends Document {
  heroHeadline: string;
  heroSubheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  lastUpdatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HomeSettingsSchema = new Schema<IHomeSettings>(
  {
    heroHeadline: { type: String, required: true, trim: true, maxlength: 150 },
    heroSubheadline: { type: String, required: true, trim: true, maxlength: 300 },
    primaryCtaLabel: { type: String, required: true, trim: true, maxlength: 50 },
    primaryCtaHref: { type: String, required: true, trim: true },
    secondaryCtaLabel: { type: String, required: true, trim: true, maxlength: 50 },
    secondaryCtaHref: { type: String, required: true, trim: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const HomeSettings: Model<IHomeSettings> =
  models.HomeSettings || model<IHomeSettings>("HomeSettings", HomeSettingsSchema);

export default HomeSettings;
