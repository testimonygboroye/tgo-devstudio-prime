"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Home, Layers, Briefcase, Newspaper, DoorOpen, Mail, Info, Workflow, Users, Star, PhoneCall, Boxes, HelpCircle, ChevronDown, MessageCircleQuestion } from "lucide-react";
import HelpSearchPopup from "@/components/shared/HelpSearchPopup";

const DESKTOP_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
  { label: "Book a Call", href: "/book-a-call" },
];

const MORE_LINKS = [
  { label: "About", href: "/about", icon: Info },
  { label: "Process", href: "/process", icon: Workflow },
  { label: "Team", href: "/team", icon: Users },
  { label: "Testimonials", href: "/testimonials", icon: Star },
  { label: "FAQ", href: "/faq", icon: MessageCircleQuestion },
  { label: "Stack", href: "/stack", icon: Boxes },
  { label: "Help & Guide", href: "/help", icon: HelpCircle },
];

const DRAWER_NAV_LINKS = [
  { label: "Home", href: "/", icon: Home },
  { label: "About", href: "/about", icon: Info },
  { label: "Services", href: "/services", icon: Layers },
  { label: "Process", href: "/process", icon: Workflow },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Team", href: "/team", icon: Users },
  { label: "Blog", href: "/blog", icon: Newspaper },
  { label: "Careers", href: "/careers", icon: DoorOpen },
  { label: "Testimonials", href: "/testimonials", icon: Star },
  { label: "FAQ", href: "/faq", icon: MessageCircleQuestion },
  { label: "Contact", href: "/contact", icon: Mail },
  { label: "Book a Call", href: "/book-a-call", icon: PhoneCall },
  { label: "Stack", href: "/stack", icon: Boxes },
  { label: "Help & Guide", href: "/help", icon: HelpCircle },
];

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

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
      <div className="border-b border-base-800 bg-base-950/90 backdrop-blur">
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
                More <ChevronDown size={14} />
              </button>

              {isMoreOpen && (
                <div className="absolute right-0 top-8 w-56 overflow-hidden rounded-lg border border-base-800 bg-base-900 shadow-2xl">
                  {MORE_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
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

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 sm:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <nav
            className="fixed right-0 top-0 flex h-screen w-2/5 min-w-[240px] max-w-xs flex-col border-l border-base-800 bg-base-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-base-800 px-4 py-5">
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                Menu
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
                className="text-neutral-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3">
              <div className="flex flex-col divide-y divide-base-800 overflow-hidden rounded-lg border border-base-800">
                {DRAWER_NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 bg-base-900 px-4 py-3.5 text-sm text-neutral-100 transition-colors hover:bg-base-800 hover:text-brand-cyan-300"
                    >
                      <Icon size={18} className="text-brand-cyan-400" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-base-800 px-4 py-4 text-center">
              <p className="text-xs text-neutral-500">© {new Date().getFullYear()} TGO DevStudio</p>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
