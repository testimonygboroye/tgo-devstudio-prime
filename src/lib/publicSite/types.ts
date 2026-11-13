export interface PublicSiteNavLink { label: string; href: string; icon?: string; }
export interface PublicSiteNavGroup { title: string; links: PublicSiteNavLink[]; }
export interface PublicSiteFooterSection { title: string; links: PublicSiteNavLink[]; }
export interface PublicSiteSocialLink { label: string; href: string; platform: string; }
export interface PublicSiteChromeSettings {
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
  navigationGroups: PublicSiteNavGroup[];
  headerCtaLabel: string;
  headerCtaHref: string;
  clientPortalLabel: string;
  clientPortalHref: string;
  footerTagline: string;
  footerAddress: string;
  contactEmail: string;
  contactPhone: string;
  newsletterEnabled: boolean;
  footerSections: PublicSiteFooterSection[];
  socialLinks: PublicSiteSocialLink[];
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
}
