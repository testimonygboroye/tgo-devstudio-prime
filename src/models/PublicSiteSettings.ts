import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IPublicNavLink { label: string; href: string; icon?: string; }
export interface IPublicNavGroup { title: string; links: IPublicNavLink[]; }
export interface IPublicFooterSection { title: string; links: IPublicNavLink[]; }
export interface IPublicSocialLink { label: string; href: string; platform: string; }

export interface IPublicSiteSettings extends Document {
  brandName: string;
  brandDescriptor: string;
  logoUrl: string;
  logoAlt: string;
  announcementEnabled: boolean;
  announcementText: string;
  navigationGroups: IPublicNavGroup[];
  headerCtaLabel: string;
  headerCtaHref: string;
  clientPortalLabel: string;
  clientPortalHref: string;
  footerTagline: string;
  footerAddress: string;
  contactEmail: string;
  contactPhone: string;
  newsletterEnabled: boolean;
  footerSections: IPublicFooterSection[];
  socialLinks: IPublicSocialLink[];
  copyrightText: string;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NavLinkSchema = new Schema<IPublicNavLink>({
  label: { type: String, required: true, trim: true, maxlength: 80 },
  href: { type: String, required: true, trim: true, maxlength: 500 },
  icon: { type: String, default: "" },
}, { _id: false });

const NavGroupSchema = new Schema<IPublicNavGroup>({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  links: { type: [NavLinkSchema], default: [] },
}, { _id: false });

const FooterSectionSchema = new Schema<IPublicFooterSection>({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  links: { type: [NavLinkSchema], default: [] },
}, { _id: false });

const SocialLinkSchema = new Schema<IPublicSocialLink>({
  label: { type: String, required: true, trim: true, maxlength: 50 },
  href: { type: String, required: true, trim: true, maxlength: 500 },
  platform: { type: String, required: true, trim: true, maxlength: 40 },
}, { _id: false });

const PublicSiteSettingsSchema = new Schema<IPublicSiteSettings>({
  brandName: { type: String, default: "TGO DevStudio", trim: true, maxlength: 100 },
  brandDescriptor: { type: String, default: "TGO DevStudio Prime", trim: true, maxlength: 120 },
  logoUrl: { type: String, default: "/logo.png", trim: true, maxlength: 1000 },
  logoAlt: { type: String, default: "TGO DevStudio logo", trim: true, maxlength: 150 },
  announcementEnabled: { type: Boolean, default: false },
  announcementText: { type: String, default: "", trim: true, maxlength: 240 },
  navigationGroups: { type: [NavGroupSchema], default: [] },
  headerCtaLabel: { type: String, default: "Start a project", trim: true, maxlength: 80 },
  headerCtaHref: { type: String, default: "/contact", trim: true, maxlength: 500 },
  clientPortalLabel: { type: String, default: "Client Portal", trim: true, maxlength: 80 },
  clientPortalHref: { type: String, default: "/client/login", trim: true, maxlength: 500 },
  footerTagline: { type: String, default: "A full-stack software engineering studio building premium, production-grade products from the ground up.", maxlength: 500 },
  footerAddress: { type: String, default: "Akure, Ondo State, Nigeria", maxlength: 200 },
  contactEmail: { type: String, default: "testimonygboroye.dev@gmail.com", trim: true, maxlength: 254 },
  contactPhone: { type: String, default: "", trim: true, maxlength: 60 },
  newsletterEnabled: { type: Boolean, default: true },
  footerSections: { type: [FooterSectionSchema], default: [] },
  socialLinks: { type: [SocialLinkSchema], default: [] },
  copyrightText: { type: String, default: "© {year} TGO DevStudio. All rights reserved.", maxlength: 200 },
  lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const PublicSiteSettings: Model<IPublicSiteSettings> =
  models.PublicSiteSettings || model<IPublicSiteSettings>("PublicSiteSettings", PublicSiteSettingsSchema);

export default PublicSiteSettings;
