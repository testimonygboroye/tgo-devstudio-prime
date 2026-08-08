"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, Newspaper, DoorOpen, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  roleName: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", hrefSuffix: "/dashboard", icon: LayoutDashboard },
  { label: "Case Studies", hrefSuffix: "/case-studies", icon: Briefcase },
  { label: "Team", hrefSuffix: "/team", icon: Users },
  { label: "Blog", hrefSuffix: "/blog", icon: Newspaper },
  { label: "Careers", hrefSuffix: "/careers", icon: DoorOpen },
];

export default function AdminSidebar({ userName, userEmail, roleName }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const basePathSegment = segments[0] ? `/${segments[0]}` : "";

  async function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = `${basePathSegment}/login`;
  }

  return (
    <aside
      className={`flex flex-col justify-between border-r border-base-800 bg-base-900 transition-all duration-200 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div>
        <div className="flex items-center justify-between px-4 py-5">
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

        <nav className="mt-2 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const href = `${basePathSegment}${item.hrefSuffix}`;
            const isActive = pathname === href;
            const Icon = item.icon;
            return (
              <Link
                key={item.hrefSuffix}
                href={href}
                title={item.label}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                  isActive
                    ? "brand-gradient-bg font-semibold text-base-950"
                    : "text-neutral-100 hover:bg-base-800"
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-base-800 px-4 py-4">
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
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
