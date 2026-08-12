import { Schema, model, models, Document, Model, Types } from "mongoose";

export type PageContentType = "about" | "privacy-policy" | "terms-of-service";

export interface IPageContent extends Document {
  type: PageContentType;
  title: string;
  content: string;
  lastUpdatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PageContentSchema = new Schema<IPageContent>(
  {
    type: {
      type: String,
      enum: ["about", "privacy-policy", "terms-of-service"],
      required: true,
      unique: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    content: { type: String, required: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const PageContent: Model<IPageContent> =
  models.PageContent || model<IPageContent>("PageContent", PageContentSchema);

export default PageContent;
