import { Schema, model, models, type Document, type Model, Types } from "mongoose";
export interface IUserWhatsAppConnection extends Document {
  userId: Types.ObjectId;
  phoneNumberId?: string;
  personalPhoneNumber: string;
  businessAccountId?: string;
  credentialsCiphertext?: string;
  status: "connected" | "error" | "disconnected";
  currentConversationId?: Types.ObjectId;
  lastVerifiedAt?: Date;
  lastInboundAt?: Date;
  optInAt?: Date;
  consentSource?: "client_settings" | "staff_settings" | "founder_settings" | "legacy";
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IUserWhatsAppConnection>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  phoneNumberId: { type: String, trim: true, maxlength: 80, index: true },
  personalPhoneNumber: { type: String, required: true, trim: true, maxlength: 30 },
  businessAccountId: { type: String, trim: true, maxlength: 80 },
  credentialsCiphertext: { type: String, select: false },
  status: { type: String, enum: ["connected", "error", "disconnected"], default: "connected", index: true },
  currentConversationId: { type: Schema.Types.ObjectId, ref: "UnifiedConversation" },
  lastVerifiedAt: Date,
  lastInboundAt: Date,
  optInAt: Date,
  consentSource: { type: String, enum: ["client_settings", "staff_settings", "founder_settings", "legacy"] },
  lastError: { type: String, maxlength: 300, default: "" },
}, { timestamps: true });
schema.index({ personalPhoneNumber: 1 }, { unique: true, partialFilterExpression: { status: "connected" }, name: "active_personal_phone_unique" });
const UserWhatsAppConnection: Model<IUserWhatsAppConnection> = models.UserWhatsAppConnection || model<IUserWhatsAppConnection>("UserWhatsAppConnection", schema);
export default UserWhatsAppConnection;
