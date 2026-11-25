"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSwipeSidebar } from "@/hooks/useSwipeSidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Bot,
  Gift,
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
  ClipboardList,
  PlugZap,
  Megaphone,
  SearchCheck,
  BrainCircuit,
  Search,
} from "lucide-react";

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  roleName: string;
  basePath: string;
  isFounder: boolean;
}

const NAV_GROUPS = [
  { title: "Overview", items: [
    { label: "Dashboard", hrefSuffix: "/dashboard", icon: LayoutDashboard, badgeKey: null },
  ]},
  { title: "Founder & Intelligence", items: [
    { label: "Founder Control Centre", hrefSuffix: "/platform", icon: Crown, badgeKey: null },
    { label: "Executive Intelligence", hrefSuffix: "/executive-intelligence", icon: BrainCircuit, badgeKey: null },
    { label: "Business Ecosystem", hrefSuffix: "/businesses", icon: Building2, badgeKey: null },
    { label: "Business Roles & Permissions", hrefSuffix: "/business-roles", icon: KeySquare, badgeKey: null },
    { label: "Visitor Analytics", hrefSuffix: "/analytics", icon: BarChart3, badgeKey: null },
    { label: "Conversion Analytics", hrefSuffix: "/analytics/conversions", icon: BarChart3, badgeKey: null },
  ]},
  { title: "AI & Automation", items: [
    { label: "AI Command Centre", hrefSuffix: "/ai-workforce", icon: Bot, badgeKey: null },
    { label: "AI Chatbot Configuration", hrefSuffix: "/ai-workforce/chatbots", icon: BrainCircuit, badgeKey: null },
  ]},
  { title: "Growth & Marketing", items: [
    { label: "Marketing & Sales", hrefSuffix: "/growth", icon: Megaphone, badgeKey: null },
    { label: "SEO Operations", hrefSuffix: "/seo", icon: SearchCheck, badgeKey: null },
    { label: "Rewards & Referrals", hrefSuffix: "/engagement", icon: Gift, badgeKey: null },
  ]},
  { title: "Sales & Client Relations", items: [
    { label: "Sales & Client Relations", hrefSuffix: "/sales-client-relations", icon: Contact, badgeKey: null },
  ]},
  { title: "Communications & Support", items: [
    { label: "Communications & Support", hrefSuffix: "/communications", icon: MessageSquare, badgeKey: "messages" },
  ]},
  { title: "People & Operations", items: [
    { label: "People & Operations", hrefSuffix: "/people-operations", icon: Network, badgeKey: null },
  ]},
  { title: "Finance & Integrations", items: [
    { label: "Finance & Payments", hrefSuffix: "/finance", icon: WalletCards, badgeKey: null },
    { label: "Integration Centre", hrefSuffix: "/integrations", icon: PlugZap, badgeKey: null },
  ]},
  { title: "Website & Creative Studio", items: [
    { label: "Content Studio", hrefSuffix: "/content-studio", icon: Image, badgeKey: null },
  ]},
  { title: "Security, Compliance & Administration", items: [
    { label: "Security & Administration", hrefSuffix: "/security-administration", icon: ShieldCheck, badgeKey: null },
  ]},
] as const;

const NAV_ROUTE_ALIASES: Record<string, string> = {
  "/clients": "/sales-client-relations",
  "/client-enquiries": "/sales-client-relations",
  "/commercial": "/sales-client-relations",
  "/book-a-call": "/sales-client-relations",
  "/contact": "/sales-client-relations",
  "/messages": "/communications",
  "/support": "/communications",
  "/newsletter": "/communications",
  "/workforce": "/people-operations",
  "/users": "/people-operations",
  "/invites": "/people-operations",
  "/applications": "/people-operations",
  "/operations": "/people-operations",
  "/operations/payroll": "/people-operations",
  "/operations/training": "/people-operations",
  "/operations/documents": "/people-operations",
  "/workspaces": "/people-operations",
  "/roles": "/people-operations",
  "/home-settings": "/content-studio",
  "/pages": "/content-studio",
  "/public-pages": "/content-studio",
  "/site-settings": "/content-studio",
  "/services": "/content-studio",
  "/case-studies": "/content-studio",
  "/process": "/content-studio",
  "/team": "/content-studio",
  "/blog": "/content-studio",
  "/careers": "/content-studio",
  "/faq-items": "/content-studio",
  "/reviews": "/content-studio",
  "/stack-items": "/content-studio",
  "/media": "/content-studio",
  "/homepage-media": "/content-studio",
  "/media-collections": "/content-studio",
  "/security": "/security-administration",
  "/privacy-requests": "/security-administration",
  "/audit-log": "/security-administration",
  "/settings": "/security-administration",
  "/help": "/security-administration",
  "/help-articles": "/security-administration",
  "/availability": "/security-administration",
};

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
  const resolveNavHref = (item: { hrefSuffix: string }) =>
    item.hrefSuffix === "/workforce" && !isFounder ? "/workforce" : `${basePathSegment}${item.hrefSuffix}`;
  const [navQuery, setNavQuery] = useState("");
  const normalizedQuery = navQuery.trim().toLowerCase();
  const visibleGroups = NAV_GROUPS
    .filter((group) => (group.title !== "Founder & Intelligence" && group.title !== "AI & Automation" && group.title !== "Finance & Integrations") || isFounder)
    .map((group) => ({ ...group, items: group.items.filter((item) => (item.hrefSuffix !== "/commercial" || isFounder) && (item.hrefSuffix !== "/engagement" || isFounder) && (!["/operations", "/operations/payroll", "/operations/documents", "/operations/training"].includes(item.hrefSuffix) || isFounder) && (!normalizedQuery || group.title.toLowerCase().includes(normalizedQuery) || item.label.toLowerCase().includes(normalizedQuery))) }))
    .filter((group) => group.items.length > 0);
  const directActiveHref = visibleGroups
    .flatMap((group) => group.items.map(resolveNavHref))
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  const aliasRoute = Object.keys(NAV_ROUTE_ALIASES)
    .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];
  const activeHref = directActiveHref || (aliasRoute ? `${basePathSegment}${NAV_ROUTE_ALIASES[aliasRoute]}` : "");

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
    const toggle = () => {
      if (window.matchMedia("(max-width: 767px)").matches) setIsMobileOpen(open => !open);
      else setIsCollapsed(value => !value);
    };
    window.addEventListener("tgo:admin-sidebar-toggle", toggle);
    return () => window.removeEventListener("tgo:admin-sidebar-toggle", toggle);
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
      <div className="relative z-20 h-full w-16 shrink-0 md:w-auto">
      <button ref={backdropRef} type="button" aria-label="Close admin navigation" onClick={() => setIsMobileOpen(false)} className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-150 md:hidden ${isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside ref={drawerRef}
        className={`fixed inset-y-0 left-0 z-[70] flex h-dvh w-16 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl transition-[width] duration-200 ease-out md:static md:z-auto md:h-full md:shrink-0 md:shadow-none ${isMobileOpen ? "w-[min(19rem,86vw)]" : "w-16"} ${collapsed ? "md:w-20" : "md:w-68"}`}
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

      <nav aria-label="Admin navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-1">
        {!collapsed && <label className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 py-2.5 text-[var(--text-muted)] focus-within:border-brand-cyan-400"><Search size={16} className="shrink-0"/><input type="search" value={navQuery} onChange={(event) => setNavQuery(event.target.value)} placeholder="Find an admin page..." aria-label="Find an admin page" className="min-w-0 w-full bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"/>{navQuery && <button type="button" onClick={() => setNavQuery("")} aria-label="Clear navigation search" className="text-xs text-brand-cyan-300">Clear</button>}</label>}
        {collapsed ? (
          <div className="flex flex-col gap-2">
            {visibleGroups.map((group) => (
              <div key={group.title} className="border-b border-[var(--border-subtle)]/70 pb-2 last:border-0">
                <div className="mb-1 flex justify-center" title={group.title}>
                  <span className="h-px w-7 rounded-full bg-brand-cyan-400/30"/>
                </div>
                {group.items.slice(0, 1).map((item) => {
                  const href = resolveNavHref(item);
                  const isActive = group.items.some((groupItem) => resolveNavHref(groupItem) === activeHref);
                  const Icon = item.icon;
                  const count = item.badgeKey ? counts[item.badgeKey] || 0 : 0;
                  return (
                    <Link key={item.hrefSuffix} href={href} prefetch={false} onClick={() => setIsMobileOpen(false)} onPointerEnter={() => router.prefetch(href)} onFocus={() => router.prefetch(href)} title={group.title} aria-label={`${group.title} — open ${item.label}`}
                      className={`group relative mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 ${isActive ? "brand-gradient-bg text-white shadow-lg shadow-brand-violet-600/25" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-brand-cyan-300"}`}>
                      <Icon size={19}/>
                      {count > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">{count > 9 ? "9+" : count}</span>}
                      <span className="pointer-events-none absolute left-full z-[90] ml-3 hidden whitespace-nowrap rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] shadow-xl group-hover:block group-focus-visible:block">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        ) : visibleGroups.map((group) => {
          const groupActive = group.items.some((item) => resolveNavHref(item) === activeHref);
          return (
            <details key={group.title} open={groupActive || undefined} className="group/nav mb-2">
              <summary title={group.title} className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:bg-[var(--surface-hover)]">
                <span>{group.title}</span><ChevronRight size={14} className="transition-transform group-open/nav:rotate-90"/>
              </summary>
              <div className="mt-1 space-y-1">
                {group.items.map((item) => {
                  const href = resolveNavHref(item);
                  const isActive = href === activeHref;
                  const Icon = item.icon;
                  const count = item.badgeKey ? counts[item.badgeKey] || 0 : 0;
                  return (
                    <Link key={item.hrefSuffix} href={href} prefetch={false} onClick={() => setIsMobileOpen(false)} onPointerEnter={() => router.prefetch(href)} onFocus={() => router.prefetch(href)} onTouchStart={() => router.prefetch(href)} title={item.label}
                      className={`group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-75 ${isActive ? "brand-gradient-bg text-white shadow-md shadow-brand-violet-600/20" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"}`}>
                      <span className="relative flex-shrink-0 flex items-center justify-center"><Icon size={18} className={isActive ? "text-white" : "text-brand-cyan-400 group-hover:scale-110 transition-transform"}/>
                        {count > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">{count > 9 ? "9+" : count}</span>}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </details>
          );
        })}
        {visibleGroups.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-5 text-center text-xs leading-5 text-[var(--text-muted)]">No admin pages match “{navQuery}”.</p>}
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
      </div>
    </>
  );
}
