import { Schema, model, models, Document, Model, Types } from "mongoose";

export type PublishStatus = "draft" | "published";

export interface IFaqItem extends Document {
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  publishStatus: PublishStatus;
  createdBy: Types.ObjectId;
  translations?: Map<string, Record<string, unknown>> | Record<string, Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
}

const FaqItemSchema = new Schema<IFaqItem>(
  {
    question: { type: String, required: true, trim: true, maxlength: 200 },
    answer: { type: String, required: true, trim: true, maxlength: 1000 },
    category: { type: String, trim: true, default: "General" },
    displayOrder: { type: Number, default: 0 },
    publishStatus: { type: String, enum: ["draft", "published"], default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    translations: {
      type: Map,
      of: new Schema(
        {
          question: { type: String, trim: true, maxlength: 200 },
          answer: { type: String, trim: true, maxlength: 1000 },
          category: { type: String, trim: true },
        },
        { _id: false }
      ),
      default: {},
    },
  },
  { timestamps: true }
);

const FaqItem: Model<IFaqItem> = models.FaqItem || model<IFaqItem>("FaqItem", FaqItemSchema);
export default FaqItem;
