"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAdminBasePath } from "@/lib/adminPath";
import { LayoutDashboard, Briefcase, Users, Newspaper, DoorOpen, Inbox, Mail, Star, Layers, Workflow, FileText, Home, HelpCircle, PhoneCall, Boxes, UserPlus, Send, BookOpen, MessageCircleQuestion, UserCog, MessageSquare, ShieldCheck, Image, ScrollText, BarChart3, KeyRound, Zap, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  roleName: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", hrefSuffix: "/dashboard", icon: LayoutDashboard, badgeKey: null },
  { label: "Security (2FA)", hrefSuffix: "/security", icon: KeyRound, badgeKey: null },
  { label: "Invites", hrefSuffix: "/invites", icon: UserPlus, badgeKey: null },
  { label: "Users & Roles", hrefSuffix: "/users", icon: UserCog, badgeKey: null },
  { label: "Manage Roles", hrefSuffix: "/roles", icon: ShieldCheck, badgeKey: null },
  { label: "Audit Log", hrefSuffix: "/audit-log", icon: ScrollText, badgeKey: null },
  { label: "Visitor Analytics", hrefSuffix: "/analytics", icon: BarChart3, badgeKey: null },
  { label: "Messages", hrefSuffix: "/messages", icon: MessageSquare, badgeKey: "messages" },
  { label: "Homepage", hrefSuffix: "/home-settings", icon: Home, badgeKey: null },
  { label: "Availability", hrefSuffix: "/availability", icon: Zap, badgeKey: null },
  { label: "Media Library", hrefSuffix: "/media", icon: Image, badgeKey: null },
  { label: "Case Studies", hrefSuffix: "/case-studies", icon: Briefcase, badgeKey: null },
  { label: "Services", hrefSuffix: "/services", icon: Layers, badgeKey: null },
  { label: "Process", hrefSuffix: "/process", icon: Workflow, badgeKey: null },
  { label: "Team", hrefSuffix: "/team", icon: Users, badgeKey: null },
  { label: "Blog", hrefSuffix: "/blog", icon: Newspaper, badgeKey: null },
  { label: "Careers", hrefSuffix: "/careers", icon: DoorOpen, badgeKey: null },
  { label: "Applications", hrefSuffix: "/applications", icon: Inbox, badgeKey: "jobApplications" },
  { label: "Contact", hrefSuffix: "/contact", icon: Mail, badgeKey: "contactSubmissions" },
  { label: "Newsletter", hrefSuffix: "/newsletter", icon: Send, badgeKey: null },
  { label: "FAQ", hrefSuffix: "/faq-items", icon: MessageCircleQuestion, badgeKey: null },
  { label: "Reviews", hrefSuffix: "/reviews", icon: Star, badgeKey: "reviews" },
  { label: "Site Pages", hrefSuffix: "/pages", icon: FileText, badgeKey: null },
  { label: "Help & Guide", hrefSuffix: "/help", icon: HelpCircle, badgeKey: null },
  { label: "Manage Articles", hrefSuffix: "/help-articles", icon: BookOpen, badgeKey: null },
  { label: "Book a Call", hrefSuffix: "/book-a-call", icon: PhoneCall, badgeKey: null },
  { label: "Stack Items", hrefSuffix: "/stack-items", icon: Boxes, badgeKey: null },
  { label: "Theme & Language", hrefSuffix: "/settings", icon: Settings, badgeKey: null },
] as const;

export default function AdminSidebar({ userName, userEmail, roleName }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const pathname = usePathname();

  const basePathSegment = getAdminBasePath();

  const loadCounts = useCallback(async () => {
    try {
      const [countsRes, messagesRes] = await Promise.all([
        fetch("/api/admin/notification-counts"),
        fetch("/api/messages/unread-count"),
      ]);
      const countsData = await countsRes.json();
      const messagesData = await messagesRes.json();

      setCounts((prev) => ({
        ...prev,
        ...(countsData.status === "ok" ? countsData.counts : {}),
        ...(messagesData.status === "ok" ? { messages: messagesData.count } : {}),
      }));
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
      className={`flex h-full flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-68"
      }`}
    >
      <div className="flex flex-shrink-0 items-center justify-between px-5 py-5 border-b border-[var(--border-subtle)]">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg brand-gradient-bg flex items-center justify-center font-bold text-white text-xs">
              T
            </div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
              TGO Admin
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors ml-auto"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const href = `${basePathSegment}${item.hrefSuffix}`;
          const isActive =
            item.hrefSuffix === "/dashboard" || item.hrefSuffix === "/help"
              ? pathname === href
              : pathname.startsWith(href);
          const Icon = item.icon;
          const count = item.badgeKey ? counts[item.badgeKey] || 0 : 0;

          return (
            <Link
              key={item.hrefSuffix}
              href={href}
              title={item.label}
              className={`group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "brand-gradient-bg text-white shadow-md shadow-brand-violet-600/20"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="relative flex-shrink-0 flex items-center justify-center">
                <Icon size={18} className={isActive ? "text-white" : "text-brand-cyan-400 group-hover:scale-110 transition-transform"} />
                {count > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-2 hidden rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-primary)] shadow-xl group-hover:block z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex-shrink-0 border-t border-[var(--border-subtle)] p-4 bg-[var(--bg-surface-2)]/50">
        {!isCollapsed && (
          <div className="mb-3 px-1">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{userName}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{userEmail}</p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-brand-cyan-400/10 px-2.5 py-0.5 text-xs font-medium text-brand-cyan-400 border border-brand-cyan-400/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan-400 animate-pulse" />
              {roleName}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Log out"
          className="flex w-full items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
        >
          <LogOut size={18} className="flex-shrink-0 text-red-400" />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
