"use client";

import { useState, useRef, useCallback } from "react";
import { useSwipeSidebar } from "@/hooks/useSwipeSidebar";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X, Layers, Briefcase, Newspaper, DoorOpen, Mail, Info, Workflow, Users, Star, PhoneCall, Boxes, HelpCircle, ChevronDown, MessageCircleQuestion, Settings, ArrowLeft, ShieldCheck, FileText, Package, Building2, Handshake } from "lucide-react";
import HelpSearchPopup from "@/components/shared/HelpSearchPopup";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { PublicSiteChromeSettings } from "@/lib/publicSite/types";

const NAV_ICON_MAP = { Layers, Briefcase, Newspaper, DoorOpen, Mail, Info, Workflow, Users, Star, PhoneCall, Boxes, HelpCircle, MessageCircleQuestion, Settings, ShieldCheck, FileText, Package, Building2, Handshake } as const;
function getNavigationIcon(name?: string) { return NAV_ICON_MAP[name as keyof typeof NAV_ICON_MAP] || Layers; }

export default function SiteHeader({ settings }: { settings?: PublicSiteChromeSettings | null }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  const activeLinkClass = "text-brand-cyan-300 after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-violet-500 after:to-cyan-400";
  const prefetchOnIntent = (href: string) => router.prefetch(href);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDesktopGroup, setOpenDesktopGroup] = useState<string | null>(null);
  const setMenuOpen = useCallback((open: boolean) => setIsMenuOpen(open), []);
  const drawerRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  useSwipeSidebar(isMenuOpen, setMenuOpen, "right", drawerRef, backdropRef);
  const DRAWER_NAV_GROUPS = [
    { title: "Company", links: [
      { label: t("nav.about"), href: "/about", icon: Info },
    ]},
    { title: "Capabilities & Work", links: [
      { label: t("nav.services"), href: "/services", icon: Layers },
      { label: "Industries", href: "/industries", icon: Building2 },
      { label: "Ways to work together", href: "/engagement-models", icon: Handshake },
      { label: "Service Packages", href: "/services/catalogue", icon: Package },
      { label: t("nav.process"), href: "/process", icon: Workflow },
      { label: t("nav.portfolio"), href: "/portfolio", icon: Briefcase },
      { label: t("nav.stack"), href: "/stack", icon: Boxes },
    ]},
    { title: "Insights & Community", links: [
      { label: t("nav.blog"), href: "/blog", icon: Newspaper },
      { label: t("nav.team"), href: "/team", icon: Users },
      { label: t("nav.testimonials"), href: "/testimonials", icon: Star },
      { label: t("nav.faq"), href: "/faq", icon: MessageCircleQuestion },
    ]},
    { title: "Connect & Support", links: [
      { label: t("nav.careers"), href: "/careers", icon: DoorOpen },
      { label: t("nav.contact"), href: "/contact", icon: Mail },
      { label: t("nav.bookACall"), href: "/book-a-call", icon: PhoneCall },
      { label: t("nav.help"), href: "/help", icon: HelpCircle },
      { label: t("common.settings"), href: "/settings", icon: Settings },
      { label: "Privacy Policy", href: "/privacy-policy", icon: ShieldCheck },
      { label: "Consumer Terms", href: "/terms-of-service", icon: FileText },
      { label: "Usage Policy", href: "/usage-policy", icon: ShieldCheck },
      { label: "Accessibility", href: "/accessibility", icon: FileText },
    ]},
  ];
  const NAV_GROUPS = settings
    ? settings.navigationGroups.map((group) => ({ title: group.title, links: group.links.map((link) => ({ label: link.label, href: link.href, icon: getNavigationIcon(link.icon) })) }))
    : DRAWER_NAV_GROUPS;

  return (
    <header className="tgo-public-header sticky top-0 z-50">
      {settings?.announcementEnabled && settings.announcementText && <div className="border-b border-brand-cyan-400/20 bg-brand-cyan-400/10 px-4 py-2 text-center text-xs font-medium text-brand-cyan-100">{settings.announcementText}</div>}
      <div className="tgo-public-header-bar border-b border-base-800 bg-base-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-12">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
            <Image src={settings?.logoUrl || "/logo.png"} alt={settings?.logoAlt || "TGO DevStudio logo"} width={36} height={36} priority unoptimized />
            <span className="font-display text-lg font-bold leading-9 text-neutral-100">{settings?.brandName || "TGO DevStudio"}</span>
          </Link>

          <nav className="hidden items-center gap-5 sm:flex" aria-label="Main navigation" onMouseLeave={() => setOpenDesktopGroup(null)}>
            <Link href="/" onClick={() => setOpenDesktopGroup(null)} className={`relative text-sm transition-colors hover:text-brand-cyan-300 ${isActive("/") ? activeLinkClass : "text-neutral-100/80"}`} aria-current={isActive("/") ? "page" : undefined}>{t("nav.home")}</Link>
            {NAV_GROUPS.map((group) => {
              const isOpen = openDesktopGroup === group.title;
              return <div key={group.title} className="relative">
                <button type="button" aria-expanded={isOpen} onClick={() => setOpenDesktopGroup(isOpen ? null : group.title)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpenDesktopGroup(group.title); } }} className="flex items-center gap-1 text-sm text-neutral-100/80 hover:text-brand-cyan-300">
                  {group.title}<ChevronDown size={14} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"}/>
                </button>
                <div className={`absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-base-800 bg-base-900 shadow-2xl transition-all ${isOpen ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0"}`}>
                  {group.links.map((link) => { const Icon = link.icon; return <Link key={link.href} href={link.href} prefetch={false} onPointerEnter={() => prefetchOnIntent(link.href)} onClick={() => setOpenDesktopGroup(null)} className={`flex items-center gap-3 border-l-2 px-4 py-3 text-sm transition-colors ${isActive(link.href) ? "border-brand-cyan-400 bg-brand-cyan-400/10 font-semibold text-brand-cyan-200" : "border-transparent text-neutral-200 hover:bg-base-800 hover:text-brand-cyan-300"}`} aria-current={isActive(link.href) ? "page" : undefined}><Icon size={16} className="text-brand-cyan-400"/>{link.label}</Link>; })}
                </div>
              </div>;
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" aria-label="Go back" onClick={() => { if (window.history.length > 1) router.back(); else router.push("/"); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-300 hover:bg-base-800 sm:hidden"><ArrowLeft size={19} /></button>
            <HelpSearchPopup />
            <Link href={settings?.headerCtaHref || "/contact"} className="hidden sm:inline-flex items-center rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-950/20 transition hover:-translate-y-0.5">{settings?.headerCtaLabel || "Start a project"}</Link>
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              className="text-neutral-100 sm:hidden"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      <div ref={backdropRef} className={`fixed inset-0 z-[60] bg-black/60 sm:hidden transition-opacity duration-150 ${isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setIsMenuOpen(false)} aria-hidden={!isMenuOpen}>
        <nav ref={drawerRef} aria-label="Main navigation" aria-hidden={!isMenuOpen} className={`fixed right-0 top-0 flex h-dvh w-[min(21rem,86vw)] flex-col border-l border-base-800 bg-base-950 shadow-2xl transition-transform duration-150 ease-out ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`} onClick={(event) => event.stopPropagation()}>
          <div className="flex flex-shrink-0 items-center justify-between border-b border-base-800 px-4 py-5"><span className="font-mono text-xs uppercase tracking-widest text-neutral-500">Explore TGO</span><button onClick={() => setIsMenuOpen(false)} aria-label="Close menu" className="text-neutral-100"><X size={22} /></button></div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3"><div className="flex flex-col divide-y divide-base-800 overflow-hidden rounded-lg border border-base-800">
            {NAV_GROUPS.map((group,index) => <details key={group.title} open={index===0} className="border-b border-base-800 last:border-0"><summary className="flex cursor-pointer list-none items-center justify-between bg-base-900 px-4 py-3.5 text-sm font-semibold text-neutral-200 hover:bg-base-800"><span>{group.title}</span><ChevronDown size={15} className="text-brand-cyan-400"/></summary><div className="bg-base-950/70">{group.links.map(link=>{const Icon=link.icon;return <Link key={link.href} href={link.href} prefetch={false} onPointerEnter={()=>prefetchOnIntent(link.href)} onFocus={()=>prefetchOnIntent(link.href)} onTouchStart={()=>prefetchOnIntent(link.href)} onClick={()=>setIsMenuOpen(false)} className={`flex items-center gap-3 border-l-2 px-6 py-3 text-sm transition-colors ${isActive(link.href) ? "border-brand-cyan-400 bg-brand-cyan-400/10 font-semibold text-brand-cyan-200" : "border-transparent text-neutral-300 hover:bg-base-800 hover:text-brand-cyan-300"}`} aria-current={isActive(link.href) ? "page" : undefined}><Icon size={17} className="text-brand-cyan-400"/>{link.label}</Link>;})}</div></details>)}
          </div></div>
          <div className="flex-shrink-0 border-t border-base-800 bg-base-950 px-4 pb-4 pt-3"><Link href={settings?.clientPortalHref || "/client/login"} onClick={() => setIsMenuOpen(false)} className="mb-3 flex w-full items-center gap-3 rounded-xl border border-brand-cyan-400/30 bg-brand-cyan-400/10 px-4 py-3 text-sm font-semibold text-brand-cyan-200 transition hover:bg-brand-cyan-400/20"><ShieldCheck size={17}/>{settings?.clientPortalLabel || "Client Portal"} <span className="ml-auto text-xs">Sign in / Register →</span></Link><p className="text-center text-xs text-neutral-500">© {new Date().getFullYear()} {settings?.brandName || "TGO DevStudio"}</p></div>
        </nav>
      </div>
    </header>
  );
}
