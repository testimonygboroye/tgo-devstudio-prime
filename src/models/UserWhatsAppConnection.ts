import { Schema, model, models, type Document, type Model, Types } from "mongoose";

export interface IUserWhatsAppConnection extends Document {
  userId: Types.ObjectId;
  phoneNumberId: string;
  personalPhoneNumber: string;
  businessAccountId: string;
  credentialsCiphertext: string;
  status: "connected" | "error" | "disconnected";
  currentConversationId?: Types.ObjectId;
  lastVerifiedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IUserWhatsAppConnection>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  phoneNumberId: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
  personalPhoneNumber: { type: String, required: true, trim: true, maxlength: 30 },
  businessAccountId: { type: String, required: true, trim: true, maxlength: 80 },
  credentialsCiphertext: { type: String, required: true, select: false },
  status: { type: String, enum: ["connected", "error", "disconnected"], default: "connected", index: true },
  currentConversationId: { type: Schema.Types.ObjectId, ref: "UnifiedConversation" },
  lastVerifiedAt: Date,
  lastError: { type: String, maxlength: 300, default: "" },
}, { timestamps: true });
const UserWhatsAppConnection: Model<IUserWhatsAppConnection> = models.UserWhatsAppConnection || model<IUserWhatsAppConnection>("UserWhatsAppConnection", schema);
export default UserWhatsAppConnection;
