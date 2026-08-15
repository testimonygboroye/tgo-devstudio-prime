import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Types.ObjectId;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorTempSecret?: string;
  refreshTokenVersion: number;
  failedLoginAttempts: number;
  lockUntil?: Date;
  isBanned: boolean;
  bannedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorTempSecret: { type: String, select: false },
    refreshTokenVersion: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    isBanned: { type: Boolean, default: false },
    bannedAt: { type: Date },
  },
  { timestamps: true }
);

const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);

export default User;
