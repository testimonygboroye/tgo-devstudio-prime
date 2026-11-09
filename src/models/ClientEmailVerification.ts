import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IClientEmailVerification extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  consumedAt?: Date;
  createdAt: Date;
}

const ClientEmailVerificationSchema = new Schema<IClientEmailVerification>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

ClientEmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ClientEmailVerificationSchema.index({ userId: 1, consumedAt: 1 });

const ClientEmailVerification: Model<IClientEmailVerification> = models.ClientEmailVerification || model<IClientEmailVerification>("ClientEmailVerification", ClientEmailVerificationSchema);
export default ClientEmailVerification;
