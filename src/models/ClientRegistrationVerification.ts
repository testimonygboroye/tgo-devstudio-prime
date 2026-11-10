import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IClientRegistrationVerification extends Document {
  email: string;
  tokenHash: string;
  expiresAt: Date;
  verifiedAt?: Date;
  consumedAt?: Date;
  createdAt: Date;
}

const schema = new Schema<IClientRegistrationVerification>({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  verifiedAt: { type: Date },
  consumedAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ email: 1, consumedAt: 1, createdAt: -1 });

const ClientRegistrationVerification: Model<IClientRegistrationVerification> =
  models.ClientRegistrationVerification || model<IClientRegistrationVerification>("ClientRegistrationVerification", schema);
export default ClientRegistrationVerification;
