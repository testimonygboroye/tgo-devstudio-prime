import { Schema, model, models, Document, Model } from "mongoose";

export type SubscriberStatus = "subscribed" | "unsubscribed";

export interface INewsletterSubscriber extends Document {
  email: string;
  status: SubscriberStatus;
  unsubscribeTokenHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: { type: String, enum: ["subscribed", "unsubscribed"], default: "subscribed" },
    unsubscribeTokenHash: { type: String, required: true },
  },
  { timestamps: true }
);

const NewsletterSubscriber: Model<INewsletterSubscriber> =
  models.NewsletterSubscriber || model<INewsletterSubscriber>("NewsletterSubscriber", NewsletterSubscriberSchema);

export default NewsletterSubscriber;
