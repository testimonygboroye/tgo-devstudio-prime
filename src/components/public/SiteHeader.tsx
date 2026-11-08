"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSwipeSidebar } from "@/hooks/useSwipeSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, X, Home, Layers, Briefcase, Newspaper, DoorOpen, Mail, Info, Workflow, Users, Star, PhoneCall, Boxes, HelpCircle, ChevronDown, MessageCircleQuestion, Settings, ArrowLeft } from "lucide-react";
import HelpSearchPopup from "@/components/shared/HelpSearchPopup";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function SiteHeader() {
  const { t } = useTranslation();
  const router = useRouter();
  const prefetchOnIntent = (href: string) => router.prefetch(href);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const setMenuOpen = useCallback((open: boolean) => setIsMenuOpen(open), []);
  const drawerRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  useSwipeSidebar(isMenuOpen, setMenuOpen, "right", drawerRef, backdropRef);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const DESKTOP_NAV_LINKS = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.services"), href: "/services" },
    { label: t("nav.portfolio"), href: "/portfolio" },
    { label: t("nav.blog"), href: "/blog" },
    { label: t("nav.careers"), href: "/careers" },
    { label: t("nav.contact"), href: "/contact" },
    { label: t("nav.bookACall"), href: "/book-a-call" },
  ];

  const MORE_LINKS = [
    { label: t("nav.about"), href: "/about", icon: Info },
    { label: t("nav.process"), href: "/process", icon: Workflow },
    { label: t("nav.team"), href: "/team", icon: Users },
    { label: t("nav.testimonials"), href: "/testimonials", icon: Star },
    { label: t("nav.faq"), href: "/faq", icon: MessageCircleQuestion },
    { label: t("nav.stack"), href: "/stack", icon: Boxes },
    { label: t("nav.help"), href: "/help", icon: HelpCircle },
    { label: t("common.settings"), href: "/settings", icon: Settings },
  ];

  const DRAWER_NAV_GROUPS = [
    { title: t("nav.home"), links: [
      { label: t("nav.home"), href: "/", icon: Home },
      { label: t("nav.about"), href: "/about", icon: Info },
    ]},
    { title: t("nav.services"), links: [
      { label: t("nav.services"), href: "/services", icon: Layers },
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
    ]},
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    if (isMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMoreOpen]);

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-base-800 bg-base-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-12">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
            <Image src="/logo.png" alt="TGO DevStudio logo" width={36} height={36} priority />
            <span className="font-display text-lg font-bold leading-9 text-neutral-100">TGO DevStudio</span>
          </Link>

          <nav className="hidden items-center gap-8 sm:flex">
            {DESKTOP_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                onPointerEnter={() => prefetchOnIntent(link.href)}
                onFocus={() => prefetchOnIntent(link.href)}
                className="text-sm text-neutral-100/80 hover:text-brand-cyan-300"
              >
                {link.label}
              </Link>
            ))}

            <div ref={moreRef} className="relative">
              <button
                onClick={() => setIsMoreOpen((prev) => !prev)}
                className="flex items-center gap-1 text-sm text-neutral-100/80 hover:text-brand-cyan-300"
              >
                {t("nav.more")} <ChevronDown size={14} />
              </button>

              {isMoreOpen && (
                <div className="absolute right-0 top-8 w-56 overflow-hidden rounded-lg border border-base-800 bg-base-900 shadow-2xl">
                  {MORE_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        prefetch={false}
                        onPointerEnter={() => prefetchOnIntent(link.href)}
                        onFocus={() => prefetchOnIntent(link.href)}
                        onClick={() => setIsMoreOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-100 hover:bg-base-800 hover:text-brand-cyan-300"
                      >
                        <Icon size={16} className="text-brand-cyan-400" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" aria-label="Go back" onClick={() => { if (window.history.length > 1) router.back(); else router.push("/"); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-300 hover:bg-base-800 sm:hidden"><ArrowLeft size={19} /></button>
            <HelpSearchPopup />
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
          <div className="flex flex-shrink-0 items-center justify-between border-b border-base-800 px-4 py-5"><span className="font-mono text-xs uppercase tracking-widest text-neutral-500">{t("nav.home")}</span><button onClick={() => setIsMenuOpen(false)} aria-label="Close menu" className="text-neutral-100"><X size={22} /></button></div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3"><div className="flex flex-col divide-y divide-base-800 overflow-hidden rounded-lg border border-base-800">
            {DRAWER_NAV_GROUPS.map((group,index) => <details key={group.title} open={index===0} className="border-b border-base-800 last:border-0"><summary className="flex cursor-pointer list-none items-center justify-between bg-base-900 px-4 py-3.5 text-sm font-semibold text-neutral-200 hover:bg-base-800"><span>{group.title}</span><ChevronDown size={15} className="text-brand-cyan-400"/></summary><div className="bg-base-950/70">{group.links.map(link=>{const Icon=link.icon;return <Link key={link.href} href={link.href} prefetch={false} onPointerEnter={()=>prefetchOnIntent(link.href)} onFocus={()=>prefetchOnIntent(link.href)} onTouchStart={()=>prefetchOnIntent(link.href)} onClick={()=>setIsMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 text-sm text-neutral-300 transition-colors hover:bg-base-800 hover:text-brand-cyan-300"><Icon size={17} className="text-brand-cyan-400"/>{link.label}</Link>;})}</div></details>)}
          </div></div>
          <div className="flex-shrink-0 border-t border-base-800 px-4 py-4 text-center"><p className="text-xs text-neutral-500">© {new Date().getFullYear()} TGO DevStudio</p></div>
        </nav>
      </div>
    </header>
  );
}
