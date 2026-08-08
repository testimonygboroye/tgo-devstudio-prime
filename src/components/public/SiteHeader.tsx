"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Team", href: "/team" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
];

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-base-800 bg-base-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-12">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
          <Image src="/logo.png" alt="TGO DevStudio logo" width={36} height={36} priority />
          <span className="font-display text-lg font-bold text-neutral-100">TGO DevStudio</span>
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
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="text-neutral-100 sm:hidden"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-base-800 bg-base-950 px-6 py-4 sm:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-neutral-100 hover:bg-base-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
