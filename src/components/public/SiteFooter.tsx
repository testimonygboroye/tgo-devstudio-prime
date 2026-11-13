"use client";

import Link from "next/link";
import Image from "next/image";
import { GitHubIcon, WhatsAppIcon, FacebookIcon, InstagramIcon } from "./SocialIcons";
import NewsletterForm from "./NewsletterForm";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { PublicSiteChromeSettings } from "@/lib/publicSite/types";

const SOCIAL_ICON_MAP = {
  whatsapp: WhatsAppIcon,
  github: GitHubIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
} as const;

export default function SiteFooter({ settings }: { settings?: PublicSiteChromeSettings | null }) {
  const { t } = useTranslation();

  const fallbackSections = [
    { title: t("nav.about"), links: [
      { label: t("nav.about"), href: "/about" },
      { label: t("nav.services"), href: "/services" },
      { label: "Industries", href: "/industries" },
      { label: "Ways to work together", href: "/engagement-models" },
      { label: "Service packages", href: "/services/catalogue" },
      { label: t("nav.process"), href: "/process" },
      { label: t("nav.team"), href: "/team" },
      { label: t("nav.stack"), href: "/stack" },
    ] },
    { title: t("nav.portfolio"), links: [
      { label: t("nav.portfolio"), href: "/portfolio" },
      { label: t("nav.blog"), href: "/blog" },
      { label: t("nav.careers"), href: "/careers" },
      { label: t("nav.testimonials"), href: "/testimonials" },
    ] },
    { title: t("nav.contact"), links: [
      { label: "Client Portal", href: "/client/login" },
      { label: t("nav.contact"), href: "/contact" },
      { label: t("nav.bookACall"), href: "/book-a-call" },
      { label: t("nav.help"), href: "/help" },
      { label: t("nav.faq"), href: "/faq" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Consumer Terms", href: "/terms-of-service" },
      { label: "Usage Policy", href: "/usage-policy" },
      { label: "Accessibility Statement", href: "/accessibility" },
      { label: "Data Deletion Requests", href: "/data-deletion" },
      { label: t("common.settings"), href: "/settings" },
    ] },
  ];

  const footerSections = settings ? settings.footerSections : fallbackSections;
  const socialLinks = settings
    ? settings.socialLinks
    : [
        { label: "WhatsApp", href: "https://wa.me/message/LUJ6PXE3ISDZF1", platform: "whatsapp" },
        { label: "GitHub", href: "https://github.com/testimonygboroye", platform: "github" },
        { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61590906354276", platform: "facebook" },
        { label: "Instagram", href: "https://www.instagram.com/testimonygboroye?igsh=MXU0dmxraXRwN2lnbw==", platform: "instagram" },
      ];
  const brandName = settings?.brandName || "TGO DevStudio";
  const contactEmail = settings ? settings.contactEmail : "testimonygboroye.dev@gmail.com";
  const copyright = (settings ? settings.copyrightText : "© {year} TGO DevStudio. All rights reserved.")
    .replaceAll("{year}", String(new Date().getFullYear()))
    .replaceAll("{brand}", brandName);

  return (
    <footer className="tgo-public-footer border-t" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-12">
        <div className="grid gap-10 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2">
              <Image src={settings?.logoUrl || "/logo.png"} alt={settings?.logoAlt || brandName + " logo"} width={32} height={32} unoptimized />
              <span className="font-display text-lg font-bold leading-8" style={{ color: "var(--text-primary)" }}>{brandName}</span>
            </div>
            {(settings ? settings.footerTagline : "A full-stack software engineering studio building premium, production-grade products from the ground up.") && <p className="mt-3 max-w-xs text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {settings ? settings.footerTagline : "A full-stack software engineering studio building premium, production-grade products from the ground up."}
            </p>}
            {settings?.footerAddress && <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>{settings.footerAddress}</p>}

            {settings?.newsletterEnabled !== false && <div className="mt-6">
              <span className="eyebrow-label">Stay Updated</span>
              <div className="mt-3"><NewsletterForm /></div>
            </div>}

            <div className="mt-5 flex flex-wrap gap-4">
              {socialLinks.map((social) => {
                const Icon = SOCIAL_ICON_MAP[social.platform.toLowerCase() as keyof typeof SOCIAL_ICON_MAP];
                return <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="hover:text-brand-cyan-300" style={{ color: "var(--text-muted)" }}>
                  {Icon ? <Icon width={20} height={20} /> : <span className="text-xs font-semibold">{social.label}</span>}
                </a>;
              })}
            </div>
          </div>

          {footerSections.map((section) => <div key={section.title}>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{section.title}</p>
            <div className="mt-4 flex flex-col gap-2.5">
              {section.links.map((link) => (
                link.href.startsWith("http") || link.href.startsWith("mailto:") || link.href.startsWith("tel:")
                  ? <a key={link.href} href={link.href} className="text-sm hover:text-brand-cyan-300" style={{ color: "var(--text-secondary)" }}>{link.label}</a>
                  : <Link key={link.href} href={link.href} className="text-sm hover:text-brand-cyan-300" style={{ color: "var(--text-secondary)" }}>{link.label}</Link>
              ))}
            </div>
          </div>)}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-7 text-center text-xs sm:flex-row sm:text-left" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
          <span>{copyright}</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {contactEmail && <a href={"mailto:" + contactEmail} className="hover:text-brand-cyan-300">{contactEmail}</a>}
            {settings?.contactPhone && <a href={"tel:" + settings.contactPhone} className="hover:text-brand-cyan-300">{settings.contactPhone}</a>}
          </div>
        </div>
      </div>
    </footer>
  );
}
