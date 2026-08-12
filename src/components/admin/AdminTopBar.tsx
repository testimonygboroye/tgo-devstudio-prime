"use client";

import { usePathname } from "next/navigation";
import HelpSearchPopup from "@/components/shared/HelpSearchPopup";

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "case-studies": "Case Studies",
  services: "Services",
  process: "Process",
  team: "Team",
  blog: "Blog",
  careers: "Careers",
  applications: "Applications",
  contact: "Contact",
  reviews: "Reviews & Feedback",
  pages: "Site Pages",
  "home-settings": "Homepage Settings",
  availability: "Availability Status",
  "book-a-call": "Book a Call Settings",
  "stack-items": "Stack Items",
  "help-articles": "Help Articles",
};

export default function AdminTopBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const sectionKey = segments[1] ?? "";
  const sectionLabel = SECTION_LABELS[sectionKey] ?? "";

  return (
    <div className="mb-6 flex items-center justify-between border-b border-base-800 pb-4">
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
        Admin{sectionLabel ? ` / ${sectionLabel}` : ""}
      </p>
      <HelpSearchPopup />
    </div>
  );
}
