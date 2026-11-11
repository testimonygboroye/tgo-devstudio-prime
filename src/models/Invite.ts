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
  approvedAt?: Date;\n  recruitmentApplicationId?: Types.ObjectId;\n  onboardingDepartmentId?: Types.ObjectId;\n  onboardingPositionId?: Types.ObjectId;\n  onboardingEmploymentType?: "full_time"|"part_time"|"contract"|"intern";\n  onboardingWorkLocation?: "remote"|"hybrid"|"onsite";\n  onboardingStartDate?: Date;
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
    approvedAt: { type: Date },\n    recruitmentApplicationId: { type: Schema.Types.ObjectId, ref: "JobApplication" },\n    onboardingDepartmentId: { type: Schema.Types.ObjectId, ref: "Department" },\n    onboardingPositionId: { type: Schema.Types.ObjectId, ref: "Position" },\n    onboardingEmploymentType: { type: String, enum: ["full_time","part_time","contract","intern"] },\n    onboardingWorkLocation: { type: String, enum: ["remote","hybrid","onsite"] },\n    onboardingStartDate: { type: Date },
  },
  { timestamps: true }
);

const Invite: Model<IInvite> = models.Invite || model<IInvite>("Invite", InviteSchema);
export default Invite;
