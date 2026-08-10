import { Schema, model, models, Document, Model, Types } from "mongoose";

export type LegalDocumentType = "privacy-policy" | "terms-of-service";

export interface ILegalDocument extends Document {
  type: LegalDocumentType;
  title: string;
  content: string;
  lastUpdatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LegalDocumentSchema = new Schema<ILegalDocument>(
  {
    type: { type: String, enum: ["privacy-policy", "terms-of-service"], required: true, unique: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    content: { type: String, required: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const LegalDocument: Model<ILegalDocument> =
  models.LegalDocument || model<ILegalDocument>("LegalDocument", LegalDocumentSchema);

export default LegalDocument;
