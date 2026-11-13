import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IPublicNavLink { label: string; href: string; icon?: string; }
export interface IPublicNavGroup { title: string; links: IPublicNavLink[]; }
export interface IPublicFooterSection { title: string; links: IPublicNavLink[]; }
export interface IPublicSocialLink { label: string; href: string; platform: string; }

export interface IPublicSiteSettings extends Document {
  brandName: string;
  brandDescriptor: string;
  siteTitle: string;
  siteDescription: string;
  faviconUrl: string;
  openGraphImageUrl: string;
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
  notFoundEyebrow: string;
  notFoundHeadline: string;
  notFoundAccent: string;
  notFoundDescription: string;
  notFoundPrimaryLabel: string;
  notFoundPrimaryHref: string;
  notFoundSecondaryLabel: string;
  notFoundSecondaryHref: string;
  errorEyebrow: string;
  errorHeadline: string;
  errorAccent: string;
  errorDescription: string;
  errorRetryLabel: string;
  errorHomeLabel: string;
  errorHomeHref: string;
  errorContactLabel: string;
  errorContactHref: string;
  offlineEyebrow: string;
  offlineHeadline: string;
  offlineDescription: string;
  offlineRetryLabel: string;
  offlineHomeLabel: string;
  offlineHomeHref: string;
  loadingBrandLabel: string;
  loadingMessage: string;
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
  siteTitle: { type: String, default: "TGO DevStudio Prime", trim: true, maxlength: 160 },
  siteDescription: { type: String, default: "TGO DevStudio builds premium software, websites, apps, SaaS platforms, AI systems, cloud solutions, and custom digital products.", trim: true, maxlength: 320 },
  faviconUrl: { type: String, default: "/favicon.png", trim: true, maxlength: 1000 },
  openGraphImageUrl: { type: String, default: "/opengraph-image", trim: true, maxlength: 1000 },
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
  notFoundEyebrow: { type: String, default: "A little off course", maxlength: 120 },
  notFoundHeadline: { type: String, default: "This page", maxlength: 160 },
  notFoundAccent: { type: String, default: "isn’t here.", maxlength: 120 },
  notFoundDescription: { type: String, default: "The address may have changed, the page may have moved, or the link may have taken a wrong turn. Let’s get you somewhere useful.", maxlength: 500 },
  notFoundPrimaryLabel: { type: String, default: "Back to homepage", maxlength: 80 },
  notFoundPrimaryHref: { type: String, default: "/", maxlength: 500 },
  notFoundSecondaryLabel: { type: String, default: "Contact the studio", maxlength: 80 },
  notFoundSecondaryHref: { type: String, default: "/contact", maxlength: 500 },
  errorEyebrow: { type: String, default: "A temporary interruption", maxlength: 120 },
  errorHeadline: { type: String, default: "We hit a small", maxlength: 160 },
  errorAccent: { type: String, default: "technical pause.", maxlength: 120 },
  errorDescription: { type: String, default: "The page could not finish loading this time. Your work has not been changed. You can safely try again or return to another part of the site.", maxlength: 500 },
  errorRetryLabel: { type: String, default: "Try again", maxlength: 80 },
  errorHomeLabel: { type: String, default: "Back home", maxlength: 80 },
  errorHomeHref: { type: String, default: "/", maxlength: 500 },
  errorContactLabel: { type: String, default: "Still having trouble? Contact the studio", maxlength: 120 },
  errorContactHref: { type: String, default: "/contact", maxlength: 500 },
  offlineEyebrow: { type: String, default: "Connection interrupted", maxlength: 120 },
  offlineHeadline: { type: String, default: "You’re offline.", maxlength: 160 },
  offlineDescription: { type: String, default: "The internet connection is unavailable right now. Your saved work remains safe. Reconnect and try again when you’re ready.", maxlength: 500 },
  offlineRetryLabel: { type: String, default: "Try again", maxlength: 80 },
  offlineHomeLabel: { type: String, default: "Go to homepage", maxlength: 80 },
  offlineHomeHref: { type: String, default: "/", maxlength: 500 },
  loadingBrandLabel: { type: String, default: "TGO DEVSTUDIO PRIME", maxlength: 120 },
  loadingMessage: { type: String, default: "Preparing your experience", maxlength: 180 },
  lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const PublicSiteSettings: Model<IPublicSiteSettings> =
  models.PublicSiteSettings || model<IPublicSiteSettings>("PublicSiteSettings", PublicSiteSettingsSchema);

export default PublicSiteSettings;
