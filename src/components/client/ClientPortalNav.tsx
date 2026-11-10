import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, UserRound, MessageSquareText, Bell, Activity, BriefcaseBusiness, Package } from "lucide-react";
import ClientSignOutButton from "@/components/client/ClientSignOutButton";

const links = [
  { href: "/client/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/client/settings", label: "Account settings", icon: UserRound },
  { href: "/client/enquiries", label: "Enquiries", icon: MessageSquareText },
  { href: "/client/services", label: "Services & projects", icon: Package },
  { href: "/client/activity", label: "Activity", icon: Activity },
  { href: "/client/notifications", label: "Notifications", icon: Bell },
  { href: "/workspaces", label: "Collaboration", icon: BriefcaseBusiness },
];

export default function ClientPortalNav({ name, email }: { name: string; email: string }) {
  return <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1024]/90 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <Link href="/client/dashboard" className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1"><Image src="/logo.png" alt="TGO DevStudio logo" width={40} height={40} className="h-full w-full object-contain"/></span><span className="min-w-0"><span className="block truncate text-sm font-bold text-white">TGO DevStudio</span><span className="block text-[10px] uppercase tracking-[.18em] text-cyan-300">Client workspace</span></span></Link>
      <nav className="hidden items-center gap-1 lg:flex">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><Icon size={15}/>{label}</Link>)}</nav>
      <div className="flex items-center gap-2"><div className="hidden max-w-40 text-right sm:block"><p className="truncate text-xs font-semibold text-white">{name}</p><p className="truncate text-[10px] text-slate-400">{email}</p></div><ClientSignOutButton/></div>
    </div>
    <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-3 py-2 lg:hidden">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/10"><Icon size={14}/>{label}</Link>)}</nav>
  </header>;
}
