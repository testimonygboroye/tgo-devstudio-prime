import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IClientEnquiry extends Document {
  clientId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  subject: string;
  message: string;
  category: "general" | "service" | "project" | "billing" | "support";
  status: "new" | "in_review" | "responded" | "closed";
  priority: "low" | "normal" | "high";
  assignedTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClientEnquirySchema = new Schema<IClientEnquiry>({
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "BusinessOrganization" },
  subject: { type: String, required: true, trim: true, maxlength: 180 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, enum: ["general", "service", "project", "billing", "support"], default: "general" },
  status: { type: String, enum: ["new", "in_review", "responded", "closed"], default: "new" },
  priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

ClientEnquirySchema.index({ clientId: 1, createdAt: -1 });
ClientEnquirySchema.index({ status: 1, priority: 1, createdAt: -1 });

const ClientEnquiry: Model<IClientEnquiry> = models.ClientEnquiry || model<IClientEnquiry>("ClientEnquiry", ClientEnquirySchema);
export default ClientEnquiry;
