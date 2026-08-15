import { Schema, model, models, Document, Model } from "mongoose";

export interface IPermissionSet {
  create: boolean;
  edit: boolean;
  publish: boolean;
  delete: boolean;
  viewAnalytics: boolean;
}

export interface IAnalyticsPermissions {
  viewOwnContentAnalytics: boolean;
  viewSiteWideAnalytics: boolean;
  viewFormSubmissionData: boolean;
}

export interface IRole extends Document {
  name: string;
  slug: string;
  isFounderRole: boolean;
  hierarchyLevel: number;
  isSystemRole: boolean;
  canManageRoles: boolean;
  canManageUsers: boolean;
  canBanUsers: boolean;
  canDeleteUsers: boolean;
  requiresTwoFactor: boolean;
  contentPermissions: Map<string, IPermissionSet>;
  analyticsPermissions: IAnalyticsPermissions;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSetSchema = new Schema<IPermissionSet>(
  {
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    publish: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    viewAnalytics: { type: Boolean, default: false },
  },
  { _id: false }
);

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isFounderRole: { type: Boolean, default: false },
    hierarchyLevel: { type: Number, required: true, default: 100 },
    isSystemRole: { type: Boolean, default: false },
    canManageRoles: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canBanUsers: { type: Boolean, default: false },
    canDeleteUsers: { type: Boolean, default: false },
    requiresTwoFactor: { type: Boolean, default: false },
    contentPermissions: {
      type: Map,
      of: PermissionSetSchema,
      default: () => new Map(),
    },
    analyticsPermissions: {
      viewOwnContentAnalytics: { type: Boolean, default: false },
      viewSiteWideAnalytics: { type: Boolean, default: false },
      viewFormSubmissionData: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const Role: Model<IRole> = models.Role || model<IRole>("Role", RoleSchema);

export default Role;
