import { Schema, model, models, Document, Model } from "mongoose";

export interface IPageView extends Document {
  path: string;
  visitorId: string;
  userAgent: string;
  referrer?: string;
  createdAt: Date;
}

const PageViewSchema = new Schema<IPageView>(
  {
    path: { type: String, required: true },
    visitorId: { type: String, required: true },
    userAgent: { type: String, required: true },
    referrer: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PageViewSchema.index({ createdAt: -1 });

const PageView: Model<IPageView> = models.PageView || model<IPageView>("PageView", PageViewSchema);
export default PageView;
