import { Schema, model, models, Document, Model, Types } from "mongoose";

export type BlogPublishStatus = "draft" | "scheduled" | "published";

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImage?: {
    url: string;
    publicId: string;
    altText: string;
  };
  tags: string[];
  publishStatus: BlogPublishStatus;
  featured: boolean;
  scheduledFor?: Date;
  metaTitle?: string;
  metaDescription?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 300 },
    contentHtml: { type: String, required: true, maxlength: 50000 },
    coverImage: {
      url: { type: String },
      publicId: { type: String },
      altText: { type: String },
    },
    tags: { type: [String], default: [] },
    publishStatus: { type: String, enum: ["draft", "scheduled", "published"], default: "draft" },
    featured: { type: Boolean, default: false },
    scheduledFor: { type: Date },
    metaTitle: { type: String },
    metaDescription: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const BlogPost: Model<IBlogPost> = models.BlogPost || model<IBlogPost>("BlogPost", BlogPostSchema);

export default BlogPost;
