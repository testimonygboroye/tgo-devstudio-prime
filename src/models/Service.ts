import { Schema, model, models, Document, Model, Types } from "mongoose";

export type PublishStatus = "draft" | "published";

export interface IServiceImage {
  url: string;
  publicId: string;
  altText: string;
}

export interface IService extends Document {
  title: string;
  summary: string;
  icon: string;
  coverImage?: IServiceImage;
  displayOrder: number;
  publishStatus: PublishStatus;
  featured: boolean;
  createdBy: Types.ObjectId;
  translations?: Map<string, Record<string, unknown>> | Record<string, Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceImageSchema = new Schema<IServiceImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    altText: { type: String, default: "" },
  },
  { _id: false }
);

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    summary: { type: String, required: true, trim: true, maxlength: 300 },
    icon: { type: String, required: true, trim: true, default: "Code" },
    coverImage: { type: ServiceImageSchema, default: undefined },
    displayOrder: { type: Number, default: 0 },
    publishStatus: { type: String, enum: ["draft", "published"], default: "draft" },
    featured: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    translations: {
      type: Map,
      of: new Schema(
        {
          title: { type: String, trim: true, maxlength: 100 },
          summary: { type: String, trim: true, maxlength: 300 },
        },
        { _id: false }
      ),
      default: {},
    },
  },
  { timestamps: true }
);

const Service: Model<IService> =
  models.Service || model<IService>("Service", ServiceSchema);

export default Service;
