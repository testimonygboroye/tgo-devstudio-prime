import { Schema, model, models, Document, Model, Types } from "mongoose";

export type PageContentType = "about" | "privacy-policy" | "terms-of-service" | "accessibility";

export interface IPageContent extends Document {
  type: PageContentType;
  title: string;
  content: string;
  lastUpdatedBy: Types.ObjectId;
  translations?: Map<string, Record<string, unknown>> | Record<string, Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
}

const PageContentSchema = new Schema<IPageContent>(
  {
    type: {
      type: String,
      enum: ["about", "privacy-policy", "terms-of-service", "accessibility"],
      required: true,
      unique: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    content: { type: String, required: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    translations: {
      type: Map,
      of: new Schema(
        {
          title: { type: String, trim: true, maxlength: 150 },
          content: { type: String },
        },
        { _id: false }
      ),
      default: {},
    },
  },
  { timestamps: true }
);

const PageContent: Model<IPageContent> =
  models.PageContent || model<IPageContent>("PageContent", PageContentSchema);

export default PageContent;
