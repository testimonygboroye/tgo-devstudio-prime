import { Schema, model, models, Document, Types } from "mongoose";
import type { Model } from "mongoose";

export interface IBookACallSettings extends Document {
  heading: string;
  description: string;
  calendlyUrl: string;
  lastUpdatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookACallSettingsSchema = new Schema<IBookACallSettings>(
  {
    heading: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    calendlyUrl: { type: String, required: true, trim: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const BookACallSettings: Model<IBookACallSettings> =
  models.BookACallSettings || model<IBookACallSettings>("BookACallSettings", BookACallSettingsSchema);

export default BookACallSettings;
