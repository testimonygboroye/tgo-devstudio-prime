import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IInvite extends Document {
  email: string;
  role: Types.ObjectId;
  tokenHash: string;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  usedAt?: Date;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    tokenHash: { type: String, required: true, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

const Invite: Model<IInvite> = models.Invite || model<IInvite>("Invite", InviteSchema);
export default Invite;
