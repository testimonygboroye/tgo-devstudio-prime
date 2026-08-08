import { Schema, model, models, Document, Model, Types } from "mongoose";

export type ProjectStatus = "live" | "in-progress" | "concept";
export type PublishStatus = "draft" | "published";

export interface IProjectImage {
  url: string;
  publicId: string;
  altText: string;
}

export interface IProject extends Document {
  title: string;
  slug: string;
  summary: string;
  problemStatement: string;
  approach: string;
  outcome: string;
  images: IProjectImage[];
  projectUrl?: string;
  repoUrl?: string;
  tags: string[];
  status: ProjectStatus;
  featured: boolean;
  publishStatus: PublishStatus;
  metaTitle?: string;
  metaDescription?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectImageSchema = new Schema<IProjectImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    altText: { type: String, required: true },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    summary: { type: String, required: true, trim: true, maxlength: 250 },
    problemStatement: { type: String, default: "", maxlength: 1500 },
    approach: { type: String, default: "", maxlength: 1500 },
    outcome: { type: String, default: "", maxlength: 1500 },
    images: { type: [ProjectImageSchema], default: [] },
    projectUrl: { type: String },
    repoUrl: { type: String },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["live", "in-progress", "concept"], default: "in-progress" },
    featured: { type: Boolean, default: false },
    publishStatus: { type: String, enum: ["draft", "published"], default: "draft" },
    metaTitle: { type: String },
    metaDescription: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Project: Model<IProject> = models.Project || model<IProject>("Project", ProjectSchema);

export default Project;
