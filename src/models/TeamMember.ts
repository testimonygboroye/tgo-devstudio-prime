import { Schema, model, models, Document, Model, Types } from "mongoose";

export type PublishStatus = "draft" | "published";

export interface ITeamMemberPhoto {
  url: string;
  publicId: string;
  altText: string;
}

export interface ITeamMember extends Document {
  name: string;
  slug: string;
  jobTitle: string;
  bio: string;
  photo?: ITeamMemberPhoto;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  displayOrder: number;
  publishStatus: PublishStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberPhotoSchema = new Schema<ITeamMemberPhoto>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    altText: { type: String, required: true },
  },
  { _id: false }
);

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    bio: { type: String, required: true, trim: true },
    photo: { type: TeamMemberPhotoSchema },
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    twitterUrl: { type: String },
    displayOrder: { type: Number, default: 0 },
    publishStatus: { type: String, enum: ["draft", "published"], default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const TeamMember: Model<ITeamMember> =
  models.TeamMember || model<ITeamMember>("TeamMember", TeamMemberSchema);

export default TeamMember;
