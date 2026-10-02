import { Schema, model, models, Document, Types } from "mongoose";
import type { Model } from "mongoose";

export interface IAboutSettings extends Document {
  founderName: string;
  founderRole: string;
  founderDescription: string;
  founderPhotoUrl: string;
  founderPhotoPublicId: string;
  lastUpdatedBy: Types.ObjectId;
  translations?: Map<string, Record<string, unknown>> | Record<string, Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
}

const AboutSettingsSchema = new Schema<IAboutSettings>(
  {
    founderName: { type: String, required: true, trim: true, maxlength: 150 },
    founderRole: { type: String, required: true, trim: true, maxlength: 100 },
    founderDescription: { type: String, required: true, trim: true, maxlength: 500 },
    founderPhotoUrl: { type: String, required: true },
    founderPhotoPublicId: { type: String, required: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    translations: {
      type: Map,
      of: new Schema(
        {
          founderName: { type: String, trim: true, maxlength: 150 },
          founderRole: { type: String, trim: true, maxlength: 100 },
          founderDescription: { type: String, trim: true, maxlength: 500 },
        },
        { _id: false }
      ),
      default: {},
    },
  },
  { timestamps: true }
);

const AboutSettings: Model<IAboutSettings> =
  models.AboutSettings || model<IAboutSettings>("AboutSettings", AboutSettingsSchema);

export default AboutSettings;
