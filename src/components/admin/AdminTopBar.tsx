"use client";

import { usePathname } from "next/navigation";
import HelpSearchPopup from "@/components/shared/HelpSearchPopup";
import ThemeToggle from "@/components/shared/ThemeToggle";

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  security: "Security & 2FA",
  invites: "Invites",
  users: "Users & Roles",
  roles: "Manage Roles",
  "audit-log": "Audit Log",
  analytics: "Visitor Analytics",
  messages: "Messages",
  "home-settings": "Homepage Settings",
  availability: "Availability Status",
  media: "Media Library",
  "case-studies": "Case Studies",
  services: "Services",
  process: "Process",
  team: "Team",
  blog: "Blog",
  careers: "Careers",
  applications: "Applications",
  contact: "Contact",
  newsletter: "Newsletter",
  "faq-items": "FAQ",
  reviews: "Reviews & Feedback",
  pages: "Site Pages",
  help: "Help & Guide",
  "help-articles": "Manage Articles",
  "book-a-call": "Book a Call Settings",
  "stack-items": "Stack Items",
  settings: "Theme & Language Settings",
};

export default function AdminTopBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const sectionKey = segments[1] ?? "";
  const sectionLabel = SECTION_LABELS[sectionKey] ?? "";

  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
          TGO Studio Admin{sectionLabel ? ` / ${sectionLabel}` : ""}
        </p>
        <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] mt-1">
          {sectionLabel || "Dashboard"}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <HelpSearchPopup />
        <ThemeToggle />
      </div>
    </div>
  );
}

