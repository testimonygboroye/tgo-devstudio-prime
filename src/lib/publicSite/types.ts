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
}
