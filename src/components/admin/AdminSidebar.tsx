"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSwipeSidebar } from "@/hooks/useSwipeSidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Bot,
  Users,
  Newspaper,
  DoorOpen,
  Inbox,
  Mail,
  Star,
  Layers,
  Workflow,
  FileText,
  Home,
  HelpCircle,
  PhoneCall,
  Boxes,
  UserPlus,
  Send,
  BookOpen,
  MessageCircleQuestion,
  MessageCircle,
  UserCog,
  Contact,
  MessageSquareText,
  MessageSquare,
  ShieldCheck,
  Crown,
  Building2,
  Network,
  Image,
  ScrollText,
  ShoppingCart,
  WalletCards,
  BarChart3,
  KeyRound,
  KeySquare,
  Zap,
  Video,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
} from "lucide-react";

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  roleName: string;
  basePath: string;
  isFounder: boolean;
}

const NAV_GROUPS = [
  { title: "Founder", items: [
    { label: "Founder Control Centre", hrefSuffix: "/platform", icon: Crown, badgeKey: null },
    { label: "Business Roles", hrefSuffix: "/business-roles", icon: KeySquare, badgeKey: null },
    { label: "Business Ecosystem", hrefSuffix: "/businesses", icon: Building2, badgeKey: null },
  ]},
  { title: "AI Workforce", items: [
    { label: "AI Command Centre", hrefSuffix: "/ai-workforce", icon: Bot, badgeKey: null },
  ]},
  { title: "Commercial & Delivery", items: [
    { label: "Sales & Delivery", hrefSuffix: "/commercial", icon: ShoppingCart, badgeKey: null },
    { label: "Finance & Payments", hrefSuffix: "/finance", icon: WalletCards, badgeKey: null },
    { label: "Customer Support", hrefSuffix: "/support", icon: LifeBuoy, badgeKey: null },
  ]},
  { title: "Overview", items: [
    { label: "Dashboard", hrefSuffix: "/dashboard", icon: LayoutDashboard, badgeKey: null },
    { label: "Visitor Analytics", hrefSuffix: "/analytics", icon: BarChart3, badgeKey: null },
  ]},
  { title: "People & Access", items: [
    { label: "Invites", hrefSuffix: "/invites", icon: UserPlus, badgeKey: null },
    { label: "Users & Roles", hrefSuffix: "/users", icon: UserCog, badgeKey: null },
    { label: "Client Management", hrefSuffix: "/clients", icon: Contact, badgeKey: null },
    { label: "Workforce Management", hrefSuffix: "/workforce", icon: Network, badgeKey: null },
    { label: "Universal Workspaces", hrefSuffix: "/workspaces", icon: MessageCircle, badgeKey: null },
    { label: "Manage Roles", hrefSuffix: "/roles", icon: ShieldCheck, badgeKey: null },
    { label: "Security (2FA)", hrefSuffix: "/security", icon: KeyRound, badgeKey: null },
    { label: "Audit Log", hrefSuffix: "/audit-log", icon: ScrollText, badgeKey: null },
  ]},
  { title: "Website Content", items: [
    { label: "Homepage", hrefSuffix: "/home-settings", icon: Home, badgeKey: null },
    { label: "Homepage Media", hrefSuffix: "/homepage-media", icon: Video, badgeKey: null },
    { label: "Case Studies", hrefSuffix: "/case-studies", icon: Briefcase, badgeKey: null },
    { label: "Services", hrefSuffix: "/services", icon: Layers, badgeKey: null },
    { label: "Process", hrefSuffix: "/process", icon: Workflow, badgeKey: null },
    { label: "Team", hrefSuffix: "/team", icon: Users, badgeKey: null },
    { label: "Blog", hrefSuffix: "/blog", icon: Newspaper, badgeKey: null },
    { label: "Careers", hrefSuffix: "/careers", icon: DoorOpen, badgeKey: null },
    { label: "FAQ", hrefSuffix: "/faq-items", icon: MessageCircleQuestion, badgeKey: null },
    { label: "Reviews", hrefSuffix: "/reviews", icon: Star, badgeKey: "reviews" },
    { label: "Site Pages", hrefSuffix: "/pages", icon: FileText, badgeKey: null },
    { label: "Stack Items", hrefSuffix: "/stack-items", icon: Boxes, badgeKey: null },
  ]},
  { title: "Messages & Leads", items: [
    { label: "Messages", hrefSuffix: "/messages", icon: MessageSquare, badgeKey: "messages" },
    { label: "Client Enquiries", hrefSuffix: "/client-enquiries", icon: MessageSquareText, badgeKey: null },
    { label: "Contact", hrefSuffix: "/contact", icon: Mail, badgeKey: "contactSubmissions" },
    { label: "Applications", hrefSuffix: "/applications", icon: Inbox, badgeKey: "jobApplications" },
    { label: "Newsletter", hrefSuffix: "/newsletter", icon: Send, badgeKey: null },
    { label: "Book a Call", hrefSuffix: "/book-a-call", icon: PhoneCall, badgeKey: null },
  ]},
  { title: "Site Tools", items: [
    { label: "Availability", hrefSuffix: "/availability", icon: Zap, badgeKey: null },
    { label: "Media Library", hrefSuffix: "/media", icon: Image, badgeKey: null },
    { label: "Help & Guide", hrefSuffix: "/help", icon: HelpCircle, badgeKey: null },
    { label: "Manage Articles", hrefSuffix: "/help-articles", icon: BookOpen, badgeKey: null },
  ]},
  { title: "Administration", items: [
    { label: "Admin Settings", hrefSuffix: "/settings", icon: Settings, badgeKey: null },
  ]},
] as const;

export default function AdminSidebar({
  userName,
  userEmail,
  roleName,
  basePath,
  isFounder,
}: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const setMobileOpen = useCallback((open: boolean) => setIsMobileOpen(open), []);
  const drawerRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  useSwipeSidebar(isMobileOpen, setMobileOpen, "left", drawerRef, backdropRef, { maxWidth: 304, railWidth: 64, mobileBreakpoint: 768 });
  const [counts, setCounts] = useState<Record<string, number>>({});
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = isCollapsed && !isMobileOpen;

  const basePathSegment = basePath;

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
    const initialLoad = setTimeout(() => { void loadCounts(); }, 0);
    const interval = setInterval(() => { void loadCounts(); }, 30000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [loadCounts]);

  async function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    await fetch("/api/auth/logout", { method: "POST" });
    router.replace(`${basePathSegment}/login`);
  }

  return (
    <>
      <button ref={backdropRef} type="button" aria-label="Close admin navigation" onClick={() => setIsMobileOpen(false)} className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-150 md:hidden ${isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside ref={drawerRef}
        className={`fixed inset-y-0 left-0 z-[70] flex h-dvh flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl transition-[width] duration-150 ease-out md:static md:z-auto md:h-full md:shrink-0 md:shadow-none ${isMobileOpen ? "w-[min(19rem,86vw)]" : "w-16"} ${collapsed ? "md:w-20" : "md:w-68"}`}
      >
      <div className="flex flex-shrink-0 items-center justify-between px-5 py-5 border-b border-[var(--border-subtle)]">
        {!collapsed && (
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
          onClick={() => {
            if (window.matchMedia("(max-width: 767px)").matches) setIsMobileOpen((open) => !open);
            else setIsCollapsed((prev) => !prev);
          }}
          aria-label={isMobileOpen ? "Close sidebar" : isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors ml-auto"
        >
          {isMobileOpen ? <ChevronLeft size={19} /> : isCollapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-1">
        {NAV_GROUPS.filter((group) => (group.title !== "Founder" && group.title !== "Commercial & Delivery") || isFounder).map((group) => {
          const groupActive = group.items.some((item) => pathname.startsWith(`${basePathSegment}${item.hrefSuffix}`));
          return (
            <details key={group.title} open={groupActive || undefined} className="group/nav mb-2">
              <summary title={group.title} className={`flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:bg-[var(--surface-hover)] ${collapsed ? "justify-center" : ""}`}>
                {!collapsed ? <><span>{group.title}</span><ChevronRight size={14} className="transition-transform group-open/nav:rotate-90"/></> : <span>{group.title.slice(0,1)}</span>}
              </summary>
              <div className="mt-1 space-y-1">
                {group.items.map((item) => {
                  const href = item.hrefSuffix === "/workforce" && !isFounder ? "/workforce" : `${basePathSegment}${item.hrefSuffix}`;
                  const isActive = item.hrefSuffix === "/dashboard" || item.hrefSuffix === "/help" ? pathname === href : pathname.startsWith(href);
                  const Icon = item.icon;
                  const count = item.badgeKey ? counts[item.badgeKey] || 0 : 0;
                  return (
                    <Link key={item.hrefSuffix} href={href} prefetch={false} onClick={() => setIsMobileOpen(false)} onPointerEnter={() => router.prefetch(href)} onFocus={() => router.prefetch(href)} onTouchStart={() => router.prefetch(href)} title={item.label}
                      className={`group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-75 ${isActive ? "brand-gradient-bg text-white shadow-md shadow-brand-violet-600/20" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"}`}>
                      <span className="relative flex-shrink-0 flex items-center justify-center"><Icon size={18} className={isActive ? "text-white" : "text-brand-cyan-400 group-hover:scale-110 transition-transform"}/>
                        {count > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">{count > 9 ? "9+" : count}</span>}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {collapsed && <div className="absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs text-[var(--text-primary)] shadow-xl group-hover:block">{item.label}</div>}
                    </Link>
                  );
                })}
              </div>
            </details>
          );
        })}
      </nav>

      <div className="flex-shrink-0 border-t border-[var(--border-subtle)] p-4 bg-[var(--bg-surface-2)]/50">
        {!collapsed && (
          <div className="mb-3 px-1">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {userName}
            </p>

            <p className="truncate text-xs text-[var(--text-muted)]">
              {userEmail}
            </p>

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
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
      </aside>
    </>
  );
}
