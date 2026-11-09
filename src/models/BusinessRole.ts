import { Schema, model, models, Document, Model } from "mongoose";

export interface IBusinessPermissionGrant {
  permission: string;
  scope: "global" | "self" | "department" | "team" | "project" | "client";
  resourceIds: string[];
}

export interface IBusinessRole extends Document {
  name: string;
  slug: string;
  description?: string;
  permissionGrants: IBusinessPermissionGrant[];
  deniedPermissions: string[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionGrantSchema = new Schema<IBusinessPermissionGrant>(
  {
    permission: { type: String, required: true, trim: true },
    scope: {
      type: String,
      enum: ["global", "self", "department", "team", "project", "client"],
      required: true,
    },
    resourceIds: { type: [String], default: [] },
  },
  { _id: false }
);

const BusinessRoleSchema = new Schema<IBusinessRole>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    permissionGrants: { type: [PermissionGrantSchema], default: [] },
    deniedPermissions: { type: [String], default: [] },
    isSystemRole: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BusinessRoleSchema.index({ slug: 1 }, { unique: true });

const BusinessRole: Model<IBusinessRole> =
  models.BusinessRole || model<IBusinessRole>("BusinessRole", BusinessRoleSchema);

export default BusinessRole;
