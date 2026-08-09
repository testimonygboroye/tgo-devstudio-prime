"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { GitHubIcon, WhatsAppIcon, FacebookIcon, InstagramIcon } from "@/components/public/SocialIcons";

interface SocialLink {
  label: string;
  description: string;
  href: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  iconBg: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "WhatsApp",
    description: "Chat with us directly",
    href: "https://wa.me/message/LUJ6PXE3ISDZF1",
    icon: WhatsAppIcon,
    iconBg: "bg-[#25D366]",
  },
  {
    label: "GitHub",
    description: "See our code and projects",
    href: "https://github.com/testimonygboroye",
    icon: GitHubIcon,
    iconBg: "bg-neutral-800",
  },
  {
    label: "Instagram",
    description: "Follow us for updates",
    href: "https://www.instagram.com/testimonygboroye",
    icon: InstagramIcon,
    iconBg: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
  },
  {
    label: "Facebook",
    description: "Like and follow our page",
    href: "https://www.facebook.com/profile.php?id=61590906354276",
    icon: FacebookIcon,
    iconBg: "bg-[#1877F2]",
  },
];

export default function SocialFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-3 w-64 overflow-hidden rounded-xl border border-base-800 bg-base-900 shadow-2xl">
          <div className="border-b border-base-800 px-4 py-3">
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              Get in Touch
            </p>
          </div>
          <div className="flex flex-col divide-y divide-base-800">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-800"
                >
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white ${social.iconBg}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-neutral-100">
                      {social.label}
                    </span>
                    <span className="block text-xs text-neutral-400">{social.description}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close social links" : "Open social links"}
        className="flex h-14 w-14 items-center justify-center rounded-full brand-gradient-bg text-base-950 shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
