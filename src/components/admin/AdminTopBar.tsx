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
  settings: "Settings",
};

const SETTINGS_SUBPAGE_LABELS: Record<string, string> = {
  theme: "Theme Settings",
  language: "Language Settings",
  languages: "Language Settings",
  notifications: "Notification Settings",
};

export default function AdminTopBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Supports both /admin/... and a configured custom admin base path.
  const adminIndex = segments.findIndex(
    (segment) =>
      segment === "admin" ||
      segment === "control-panel" ||
      segment === "studio-admin"
  );

  const adminSegments =
    adminIndex >= 0 ? segments.slice(adminIndex + 1) : segments.slice(1);

  const sectionKey = adminSegments[0] ?? "";
  const subpageKey = adminSegments[1] ?? "";

  const isSettings = sectionKey === "settings";

  const sectionLabel = isSettings
    ? "Settings"
    : SECTION_LABELS[sectionKey] ?? "";

  const subpageLabel = isSettings
    ? SETTINGS_SUBPAGE_LABELS[subpageKey]
    : undefined;

  const breadcrumb = [
    "TGO Studio Admin",
    sectionLabel,
    subpageLabel,
  ]
    .filter(Boolean)
    .join(" / ");

  const heading = subpageLabel || sectionLabel || "Dashboard";

  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
          {breadcrumb}
        </p>

        <h1 className="mt-1 text-2xl font-bold font-display text-[var(--text-primary)]">
          {heading}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <HelpSearchPopup />
        <ThemeToggle />
      </div>
    </div>
  );
}
