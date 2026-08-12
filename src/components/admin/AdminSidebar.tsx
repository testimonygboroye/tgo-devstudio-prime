"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, Newspaper, DoorOpen, Inbox, Mail, Star, Layers, Workflow, FileText, Home, HelpCircle, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  roleName: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", hrefSuffix: "/dashboard", icon: LayoutDashboard, badgeKey: null },
  { label: "Homepage", hrefSuffix: "/home-settings", icon: Home, badgeKey: null },
  { label: "Case Studies", hrefSuffix: "/case-studies", icon: Briefcase, badgeKey: null },
  { label: "Services", hrefSuffix: "/services", icon: Layers, badgeKey: null },
  { label: "Process", hrefSuffix: "/process", icon: Workflow, badgeKey: null },
  { label: "Team", hrefSuffix: "/team", icon: Users, badgeKey: null },
  { label: "Blog", hrefSuffix: "/blog", icon: Newspaper, badgeKey: null },
  { label: "Careers", hrefSuffix: "/careers", icon: DoorOpen, badgeKey: null },
  { label: "Applications", hrefSuffix: "/applications", icon: Inbox, badgeKey: "jobApplications" },
  { label: "Contact", hrefSuffix: "/contact", icon: Mail, badgeKey: "contactSubmissions" },
  { label: "Reviews", hrefSuffix: "/reviews", icon: Star, badgeKey: "reviews" },
  { label: "Site Pages", hrefSuffix: "/pages", icon: FileText, badgeKey: null },
  { label: "Help Articles", hrefSuffix: "/help-articles", icon: HelpCircle, badgeKey: null },
] as const;

export default function AdminSidebar({ userName, userEmail, roleName }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const basePathSegment = segments[0] ? `/${segments[0]}` : "";

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notification-counts");
      const data = await res.json();
      if (data.status === "ok") {
        setCounts(data.counts);
      }
    } catch {
      // Silently ignore — badges just won't update this cycle.
    }
  }, []);

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, [loadCounts]);

  async function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = `${basePathSegment}/login`;
  }

  return (
    <aside
      className={`flex h-full flex-col border-r border-base-800 bg-base-900 transition-all duration-200 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-shrink-0 items-center justify-between px-4 py-5">
        {!isCollapsed && (
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            TGO Prime Admin
          </span>
        )}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-1 text-neutral-400 hover:bg-base-800 hover:text-neutral-100"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        <div className="flex flex-col divide-y divide-base-800 overflow-hidden rounded-lg border border-base-800">
          {NAV_ITEMS.map((item) => {
            const href = `${basePathSegment}${item.hrefSuffix}`;
            const isActive = pathname === href;
            const Icon = item.icon;
            const count = item.badgeKey ? counts[item.badgeKey] || 0 : 0;

            return (
              <Link
                key={item.hrefSuffix}
                href={href}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-3 text-sm transition-colors ${
                  isActive
                    ? "brand-gradient-bg font-semibold text-base-950"
                    : "bg-base-900 text-neutral-100 hover:bg-base-800"
                }`}
              >
                <span className="relative flex-shrink-0">
                  <Icon size={18} className={isActive ? "text-base-950" : "text-brand-cyan-400"} />
                  {count > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex-shrink-0 border-t border-base-800 px-4 py-4">
        {!isCollapsed && (
          <div className="mb-3">
            <p className="truncate text-sm font-semibold text-neutral-100">{userName}</p>
            <p className="truncate text-xs text-neutral-400">{userEmail}</p>
            <p className="mt-1 text-xs text-brand-cyan-300">{roleName}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Log out"
          className="flex w-full items-center gap-3 rounded-md border border-base-800 px-3 py-2 text-sm text-neutral-100 hover:bg-base-800"
        >
          <LogOut size={18} className="flex-shrink-0 text-brand-cyan-400" />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
