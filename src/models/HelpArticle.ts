import { Schema, model, models, Document, Model, Types } from "mongoose";

export type ArticleVisibility = "public" | "preLogin" | "anyAuthenticated" | "permission";

export interface IHelpArticle extends Document {
  title: string;
  slug: string;
  bodyHtml: string;
  visibility: ArticleVisibility;
  requiredContentType?: string;
  category: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HelpArticleSchema = new Schema<IHelpArticle>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    bodyHtml: { type: String, required: true },
    visibility: {
      type: String,
      enum: ["public", "preLogin", "anyAuthenticated", "permission"],
      default: "anyAuthenticated",
    },
    requiredContentType: { type: String, trim: true },
    category: { type: String, trim: true, default: "General" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const HelpArticle: Model<IHelpArticle> =
  models.HelpArticle || model<IHelpArticle>("HelpArticle", HelpArticleSchema);

export default HelpArticle;
