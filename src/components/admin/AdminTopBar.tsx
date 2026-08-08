"use client";

import { usePathname } from "next/navigation";

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "case-studies": "Case Studies",
  team: "Team",
  blog: "Blog",
  careers: "Careers",
};

export default function AdminTopBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const sectionKey = segments[1] ?? "";
  const sectionLabel = SECTION_LABELS[sectionKey] ?? "";

  return (
    <div className="mb-6 border-b border-base-800 pb-4">
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
        Admin{sectionLabel ? ` / ${sectionLabel}` : ""}
      </p>
    </div>
  );
}
