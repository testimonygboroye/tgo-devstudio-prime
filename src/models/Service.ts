import { Schema, model, models, Document, Model, Types } from "mongoose";

export type PublishStatus = "draft" | "published";

export interface IService extends Document {
  title: string;
  summary: string;
  icon: string;
  displayOrder: number;
  publishStatus: PublishStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    summary: { type: String, required: true, trim: true, maxlength: 300 },
    icon: { type: String, required: true, trim: true, default: "Code" },
    displayOrder: { type: Number, default: 0 },
    publishStatus: { type: String, enum: ["draft", "published"], default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Service: Model<IService> = models.Service || model<IService>("Service", ServiceSchema);
export default Service;
