import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export type PublicPageKey = "industries" | "engagement-models";
export interface IPublicPageCard {
  icon: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  bulletPoints: string[];
  displayOrder: number;
}
export interface IPublicPageContent extends Document {
  pageKey: PublicPageKey;
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroAccent: string;
  heroDescription: string;
  heroNote: string;
  introEyebrow: string;
  introHeading: string;
  introDescription: string;
  cards: IPublicPageCard[];
  ctaEyebrow: string;
  ctaHeading: string;
  ctaDescription: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<IPublicPageCard>({
  icon: { type: String, default: "Layers3", trim: true, maxlength: 60 },
  eyebrow: { type: String, default: "", trim: true, maxlength: 100 },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  subtitle: { type: String, default: "", trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 1200 },
  bulletPoints: { type: [String], default: [] },
  displayOrder: { type: Number, default: 0 },
}, { _id: false });

const PublicPageContentSchema = new Schema<IPublicPageContent>({
  pageKey: { type: String, enum: ["industries", "engagement-models"], required: true, unique: true },
  metaTitle: { type: String, default: "", trim: true, maxlength: 160 },
  metaDescription: { type: String, default: "", trim: true, maxlength: 320 },
  heroEyebrow: { type: String, default: "", trim: true, maxlength: 120 },
  heroHeadline: { type: String, required: true, trim: true, maxlength: 180 },
  heroAccent: { type: String, default: "", trim: true, maxlength: 100 },
  heroDescription: { type: String, required: true, trim: true, maxlength: 800 },
  heroNote: { type: String, default: "", trim: true, maxlength: 300 },
  introEyebrow: { type: String, default: "", trim: true, maxlength: 120 },
  introHeading: { type: String, default: "", trim: true, maxlength: 180 },
  introDescription: { type: String, default: "", trim: true, maxlength: 800 },
  cards: { type: [CardSchema], default: [] },
  ctaEyebrow: { type: String, default: "", trim: true, maxlength: 120 },
  ctaHeading: { type: String, default: "", trim: true, maxlength: 180 },
  ctaDescription: { type: String, default: "", trim: true, maxlength: 800 },
  ctaPrimaryLabel: { type: String, default: "Contact us", trim: true, maxlength: 80 },
  ctaPrimaryHref: { type: String, default: "/contact", trim: true, maxlength: 500 },
  ctaSecondaryLabel: { type: String, default: "", trim: true, maxlength: 80 },
  ctaSecondaryHref: { type: String, default: "", trim: true, maxlength: 500 },
  lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const PublicPageContent: Model<IPublicPageContent> =
  models.PublicPageContent || model<IPublicPageContent>("PublicPageContent", PublicPageContentSchema);

export default PublicPageContent;
