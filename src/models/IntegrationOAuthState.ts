import { Schema, model, models, type Document, type Model, Types } from "mongoose";
export interface IIntegrationOAuthState extends Document {
  stateHash: string;
  providerId: string;
  applicationId: Types.ObjectId;
  ownerType: "founder" | "client";
  ownerId: Types.ObjectId;
  userId: Types.ObjectId;
  redirectUri: string;
  scopes: string[];
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}
const schema = new Schema<IIntegrationOAuthState>({
  stateHash: { type: String, required: true, unique: true, select: false },
  providerId: { type: String, required: true, index: true },
  applicationId: { type: Schema.Types.ObjectId, ref: "IntegrationApplication", required: true },
  ownerType: { type: String, enum: ["founder", "client"], required: true },
  ownerId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  redirectUri: { type: String, required: true },
  scopes: { type: [String], default: [] },
  expiresAt: { type: Date, required: true },
  usedAt: Date,
}, { timestamps: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ ownerType: 1, ownerId: 1, createdAt: -1 });
const M: Model<IIntegrationOAuthState> = models.IntegrationOAuthState || model<IIntegrationOAuthState>("IntegrationOAuthState", schema);
export default M;
