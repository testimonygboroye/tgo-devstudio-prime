import Link from "next/link";
import { LayoutDashboard, ClipboardCheck, UserRoundCog, CalendarCheck, BriefcaseBusiness, LogOut } from "lucide-react";
import { getAdminBasePath } from "@/lib/adminPath";

const links = [
  { href: "/workforce", label: "My workspace", icon: LayoutDashboard },
  { href: "/workforce/onboarding", label: "Onboarding", icon: ClipboardCheck },
  { href: "/workforce/profile", label: "My profile", icon: UserRoundCog },
  { href: "/workforce/reviews", label: "Performance", icon: CalendarCheck },
  { href: "/workspaces", label: "Team collaboration", icon: BriefcaseBusiness },
];

export default function WorkforceLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[var(--bg-page)] text-[var(--text-primary)]">
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/workforce" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 font-bold text-white">T</span><span><span className="block text-sm font-bold">TGO DevStudio Prime</span><span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-400">Workforce Portal</span></span></Link>
        <Link href={getAdminBasePath()+"/dashboard"} className="rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:border-cyan-400/40">Administration <LogOut size={13} className="ml-1 inline"/></Link>
      </div>
    </header>
    <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-5 sm:px-6 md:grid-cols-[230px_minmax(0,1fr)] md:py-7">
      <aside className="h-fit rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
        <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--text-muted)]">Workspace navigation</p>
        <nav aria-label="Workforce portal navigation" className="grid grid-cols-2 gap-1 md:grid-cols-1">
          {links.map(({href,label,icon:Icon})=><Link key={href} href={href} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-2)] hover:text-cyan-300"><Icon size={16}/>{label}</Link>)}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
    <footer className="border-t border-[var(--border-subtle)] px-4 py-5 text-center text-xs text-[var(--text-muted)]">TGO DevStudio Prime · Secure Workforce Environment</footer>
  </div>;
}