"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Home, Briefcase, Users, Newspaper, DoorOpen } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Team", href: "/team", icon: Users },
  { label: "Blog", href: "/blog", icon: Newspaper },
  { label: "Careers", href: "/careers", icon: DoorOpen },
];

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-base-800 bg-base-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-12">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
            <Image src="/logo.png" alt="TGO DevStudio logo" width={36} height={36} priority />
            <span className="font-display text-lg font-bold leading-9 text-neutral-100">TGO DevStudio</span>
          </Link>

          <nav className="hidden items-center gap-8 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-100/80 hover:text-brand-cyan-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            className="text-neutral-100 sm:hidden"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 sm:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <nav
            className="fixed right-0 top-0 flex h-screen w-2/5 min-w-[240px] max-w-xs flex-col border-l border-base-800 bg-base-950 px-4 py-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between px-2">
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
            <div className="flex flex-col divide-y divide-base-800 overflow-hidden rounded-lg border border-base-800">
              {NAV_LINKS.map((link) => {
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
          </nav>
        </div>
      )}
    </header>
  );
}
