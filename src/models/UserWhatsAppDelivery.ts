import { Schema, model, models, type Document, type Model, Types } from "mongoose";
export interface IUserWhatsAppDelivery extends Document {
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  externalMessageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  createdAt: Date;
}
const schema = new Schema<IUserWhatsAppDelivery>({
  messageId: { type: Schema.Types.ObjectId, ref: "UnifiedMessage", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  externalMessageId: { type: String, required: true, unique: true, maxlength: 180 },
  status: { type: String, enum: ["sent", "delivered", "read", "failed"], default: "sent" },
}, { timestamps: true });
const UserWhatsAppDelivery: Model<IUserWhatsAppDelivery> = models.UserWhatsAppDelivery || model<IUserWhatsAppDelivery>("UserWhatsAppDelivery", schema);
export default UserWhatsAppDelivery;
