import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IBusinessMembership extends Document {
  userId: Types.ObjectId;
  roleIds: Types.ObjectId[];
  departmentIds: string[];
  teamIds: string[];
  status: "active" | "suspended" | "revoked";
  createdAt: Date;
  updatedAt: Date;
}

const BusinessMembershipSchema = new Schema<IBusinessMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roleIds: [{ type: Schema.Types.ObjectId, ref: "BusinessRole" }],
    departmentIds: { type: [String], default: [] },
    teamIds: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "suspended", "revoked"],
      default: "active",
      required: true,
    },
  },
  { timestamps: true }
);

BusinessMembershipSchema.index({ userId: 1 }, { unique: true });
BusinessMembershipSchema.index({ status: 1, updatedAt: -1 });

const BusinessMembership: Model<IBusinessMembership> =
  models.BusinessMembership ||
  model<IBusinessMembership>("BusinessMembership", BusinessMembershipSchema);

export default BusinessMembership;
