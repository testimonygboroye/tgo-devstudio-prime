import Link from "next/link";
import Image from "next/image";
import { GitHubIcon, WhatsAppIcon, FacebookIcon, InstagramIcon } from "./SocialIcons";

const SOCIAL_LINKS = [
  { label: "WhatsApp", href: "https://wa.me/message/LUJ6PXE3ISDZF1", Icon: WhatsAppIcon },
  { label: "GitHub", href: "https://github.com/testimonygboroye", Icon: GitHubIcon },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61590906354276", Icon: FacebookIcon },
  { label: "Instagram", href: "https://www.instagram.com/testimonygboroye?igsh=MXU0dmxraXRwN2lnbw==", Icon: InstagramIcon },
];

const QUICK_LINKS = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "Team", href: "/team" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-base-800 bg-base-950">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="TGO DevStudio logo" width={32} height={32} />
              <span className="font-display text-lg font-bold text-neutral-100">TGO DevStudio</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-neutral-400">
              A full-stack software engineering studio building premium, production-grade
              products from the ground up.
            </p>
            <p className="mt-3 text-xs text-neutral-400">Akure, Ondo State, Nigeria</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-100">Explore</p>
            <div className="mt-3 flex flex-col gap-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-neutral-400 hover:text-brand-cyan-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-100">Connect</p>
            <div className="mt-3 flex gap-4">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-neutral-400 hover:text-brand-cyan-300"
                >
                  <Icon width={20} height={20} />
                </a>
              ))}
            </div>
            <a
              href="mailto:testimonygboroye.dev@gmail.com"
              className="mt-4 block text-sm text-neutral-400 hover:text-brand-cyan-300"
            >
              testimonygboroye.dev@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-base-800 pt-6 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} TGO DevStudio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
