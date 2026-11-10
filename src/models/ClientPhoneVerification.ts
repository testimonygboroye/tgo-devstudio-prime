import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
export interface IClientPhoneVerification extends Document {
  userId: Types.ObjectId;
  phone: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  verifiedAt?: Date;
  createdAt: Date;
}
const schema = new Schema<IClientPhoneVerification>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  phone: { type: String, required: true, trim: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  verifiedAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const M: Model<IClientPhoneVerification> = models.ClientPhoneVerification || model<IClientPhoneVerification>("ClientPhoneVerification", schema);
export default M;
