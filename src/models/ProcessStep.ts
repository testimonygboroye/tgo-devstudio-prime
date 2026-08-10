import { Schema, model, models, Document, Model, Types } from "mongoose";

export type PublishStatus = "draft" | "published";

export interface IProcessStep extends Document {
  title: string;
  description: string;
  displayOrder: number;
  publishStatus: PublishStatus;
  featured: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProcessStepSchema = new Schema<IProcessStep>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 400 },
    displayOrder: { type: Number, default: 0 },
    publishStatus: { type: String, enum: ["draft", "published"], default: "draft" },
    featured: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const ProcessStep: Model<IProcessStep> =
  models.ProcessStep || model<IProcessStep>("ProcessStep", ProcessStepSchema);

export default ProcessStep;
