import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface ITwoFactorDisableToken extends Document {
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const TwoFactorDisableTokenSchema = new Schema<ITwoFactorDisableToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

const TwoFactorDisableToken: Model<ITwoFactorDisableToken> =
  models.TwoFactorDisableToken ||
  model<ITwoFactorDisableToken>("TwoFactorDisableToken", TwoFactorDisableTokenSchema);
export default TwoFactorDisableToken;
