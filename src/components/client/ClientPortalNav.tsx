"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, UserRound, MessageSquareText, Bell, Activity, BriefcaseBusiness, Package, LifeBuoy, Menu, X } from "lucide-react";
import ClientSignOutButton from "@/components/client/ClientSignOutButton";

const groups = [
  { title: "Workspace", links: [
    { href: "/client/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/client/services", label: "Services & projects", icon: Package },
    { href: "/workspaces", label: "Collaboration", icon: BriefcaseBusiness },
  ]},
  { title: "Communication", links: [
    { href: "/client/enquiries", label: "Enquiries", icon: MessageSquareText },
    { href: "/client/notifications", label: "Notifications", icon: Bell },
    { href: "/client/support", label: "Support centre", icon: LifeBuoy },
  ]},
  { title: "Your account", links: [
    { href: "/client/activity", label: "Activity history", icon: Activity },
    { href: "/client/settings", label: "Account settings", icon: UserRound },
  ]},
];

export default function ClientPortalNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigation = (mobile = false) => <nav className="space-y-6">
    {groups.map(group => <section key={group.title}>
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">{group.title}</p>
      <div className="space-y-1">{group.links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/client/dashboard" && pathname.startsWith(href + "/"));
        return <Link key={href} href={href} onClick={() => mobile && setMobileOpen(false)} aria-current={active ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "border border-violet-400/25 bg-violet-500/15 text-white shadow-[inset_3px_0_0_#8b5cf6]" : "border border-transparent text-slate-400 hover:bg-white/[.06] hover:text-white"}`}>
          <Icon size={17} className={active ? "text-cyan-300" : "text-slate-500"}/>{label}
        </Link>;
      })}</div>
    </section>)}
  </nav>;
  return <>
    <style>{`@media (min-width: 1024px) { body:has(.tgo-client-sidebar) main { margin-left: 17rem !important; } }`}</style>
    <aside className="tgo-client-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#0b1024]/95 px-4 py-5 backdrop-blur-xl lg:flex">
      <Link href="/client/dashboard" className="mb-8 flex items-center gap-3 rounded-xl px-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-transparent p-0.5">
          <Image src="/logo.png" alt="TGO DevStudio logo" width={44} height={44} className="h-full w-full object-contain"/>
        </span>
        <span><span className="block text-sm font-bold text-white">TGO DevStudio</span><span className="block text-[10px] uppercase tracking-[.16em] text-cyan-300">Client workspace</span></span>
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">{navigation()}</div>
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="truncate px-2 text-xs font-semibold text-white">{name}</p><p className="mb-3 truncate px-2 text-[10px] text-slate-500">{email}</p>
        <ClientSignOutButton/>
      </div>
    </aside>
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0b1024]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Link href="/client/dashboard" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-transparent p-0.5"><Image src="/logo.png" alt="TGO DevStudio logo" width={36} height={36} className="h-full w-full object-contain"/></span>
        <span><span className="block text-sm font-bold text-white">TGO DevStudio</span><span className="block text-[9px] uppercase tracking-[.15em] text-cyan-300">Client workspace</span></span>
      </Link>
      <div className="flex items-center gap-2"><ClientSignOutButton/><button type="button" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} onClick={() => setMobileOpen(v => !v)} className="rounded-xl border border-white/10 p-2 text-slate-200 hover:bg-white/10">{mobileOpen ? <X size={18}/> : <Menu size={18}/>}</button></div>
    </header>
    {mobileOpen && <div className="fixed inset-0 z-50 bg-[#070b19]/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
      <aside className="flex h-full w-[min(86vw,20rem)] flex-col border-r border-white/10 bg-[#0b1024] p-4 shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between"><span className="text-sm font-bold text-white">Portal navigation</span><button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><X size={18}/></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto">{navigation(true)}</div>
        <div className="mt-5 border-t border-white/10 pt-4"><p className="truncate text-xs font-semibold text-white">{name}</p><p className="mb-3 truncate text-[10px] text-slate-500">{email}</p><ClientSignOutButton/></div>
      </aside>
    </div>}
  </>;
}
