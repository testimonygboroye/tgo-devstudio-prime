"use client";

import Link from "next/link";
import Image from "next/image";
import { GitHubIcon, WhatsAppIcon, FacebookIcon, InstagramIcon } from "./SocialIcons";
import NewsletterForm from "./NewsletterForm";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const SOCIAL_LINKS = [
  { label: "WhatsApp", href: "https://wa.me/message/LUJ6PXE3ISDZF1", Icon: WhatsAppIcon },
  { label: "GitHub", href: "https://github.com/testimonygboroye", Icon: GitHubIcon },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61590906354276", Icon: FacebookIcon },
  { label: "Instagram", href: "https://www.instagram.com/testimonygboroye?igsh=MXU0dmxraXRwN2lnbw==", Icon: InstagramIcon },
];

export default function SiteFooter() {
  const { t } = useTranslation();

  const COMPANY_LINKS = [
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.services"), href: "/services" },
    { label: t("nav.process"), href: "/process" },
    { label: t("nav.team"), href: "/team" },
    { label: t("nav.stack"), href: "/stack" },
  ];

  const WORK_LINKS = [
    { label: t("nav.portfolio"), href: "/portfolio" },
    { label: t("nav.blog"), href: "/blog" },
    { label: t("nav.careers"), href: "/careers" },
    { label: t("nav.testimonials"), href: "/testimonials" },
  ];

  const LEGAL_LINKS = [
    { label: t("nav.contact"), href: "/contact" },
    { label: t("nav.bookACall"), href: "/book-a-call" },
    { label: t("nav.help"), href: "/help" },
    { label: t("nav.faq"), href: "/faq" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Accessibility", href: "/accessibility" },
    { label: t("common.settings"), href: "/settings" },
  ];

  return (
    <footer className="border-t" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-12">
        <div className="grid gap-10 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="TGO DevStudio logo" width={32} height={32} />
              <span className="font-display text-lg font-bold leading-8" style={{ color: "var(--text-primary)" }}>TGO DevStudio</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              A full-stack software engineering studio building premium, production-grade
              products from the ground up.
            </p>
            <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>Akure, Ondo State, Nigeria</p>

            <div className="mt-6">
              <span className="eyebrow-label">Stay Updated</span>
              <div className="mt-3">
                <NewsletterForm />
              </div>
            </div>

            <div className="mt-5 flex gap-4">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="hover:text-brand-cyan-300" style={{ color: "var(--text-muted)" }}>
                  <Icon width={20} height={20} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("nav.about")}</p>
            <div className="mt-4 flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm hover:text-brand-cyan-300" style={{ color: "var(--text-secondary)" }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("nav.portfolio")}</p>
            <div className="mt-4 flex flex-col gap-2.5">
              {WORK_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm hover:text-brand-cyan-300" style={{ color: "var(--text-secondary)" }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("nav.contact")}</p>
            <div className="mt-4 flex flex-col gap-2.5">
              {LEGAL_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm hover:text-brand-cyan-300" style={{ color: "var(--text-secondary)" }}>
                  {link.label}
                </Link>
              ))}
            </div>
            <a href="mailto:testimonygboroye.dev@gmail.com" className="mt-4 block text-sm hover:text-brand-cyan-300" style={{ color: "var(--text-secondary)" }}>
              testimonygboroye.dev@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-12 border-t pt-7 text-center text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} TGO DevStudio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
