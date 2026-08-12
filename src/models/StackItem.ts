import { Schema, model, models, Document, Model, Types } from "mongoose";

export type PublishStatus = "draft" | "published";

export interface IStackItem extends Document {
  category: string;
  title: string;
  description: string;
  displayOrder: number;
  publishStatus: PublishStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StackItemSchema = new Schema<IStackItem>(
  {
    category: { type: String, required: true, trim: true, maxlength: 60 },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 400 },
    displayOrder: { type: Number, default: 0 },
    publishStatus: { type: String, enum: ["draft", "published"], default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const StackItem: Model<IStackItem> =
  models.StackItem || model<IStackItem>("StackItem", StackItemSchema);

export default StackItem;
