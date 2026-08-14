import { Schema, model, models, Document, Model, Types } from "mongoose";

export type RoleChangeStatus = "pending" | "accepted" | "rejected";

export interface IRoleChangeRequest extends Document {
  user: Types.ObjectId;
  currentRole: Types.ObjectId;
  requestedRole: Types.ObjectId;
  requestedBy: Types.ObjectId;
  status: RoleChangeStatus;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoleChangeRequestSchema = new Schema<IRoleChangeRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    currentRole: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    requestedRole: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

const RoleChangeRequest: Model<IRoleChangeRequest> =
  models.RoleChangeRequest || model<IRoleChangeRequest>("RoleChangeRequest", RoleChangeRequestSchema);
export default RoleChangeRequest;
