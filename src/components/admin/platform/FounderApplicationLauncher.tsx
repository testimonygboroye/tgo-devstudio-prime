"use client";

import Link from "next/link";
import { ArrowUpRight, Globe2, LayoutDashboard, Building2, Users, LockKeyhole, Sparkles, Bot, Workflow, LifeBuoy } from "lucide-react";

type LauncherItem = {
  title: string; description: string; href?: string; status: "available" | "planned";
  icon: typeof Globe2; eyebrow: string;
};

const items: LauncherItem[] = [
  { title: "Public Website", description: "Open the live TGO DevStudio website and its public-facing services.", href: "/", status: "available", icon: Globe2, eyebrow: "Live environment" },
  { title: "Website Administration", description: "Manage website content, users, analytics and existing CMS operations.", href: "/admin/dashboard", status: "available", icon: LayoutDashboard, eyebrow: "Existing administration" },
  { title: "Business Ecosystem", description: "Manage the shared directory of internal units, clients, partners and vendors.", href: "/admin/businesses", status: "available", icon: Building2, eyebrow: "Business administration" },
  { title: "Client Portal", description: "Client accounts, profile settings, enquiries, notifications and relationship updates.", href: "/client/login", status: "available", icon: Users, eyebrow: "Live client environment" },
  { title: "Workforce Portal", description: "Employee profile, assigned work, schedules, requests, reviews and team workspace.", href: "/workforce", status: "available", icon: Workflow, eyebrow: "Live workforce environment" },\n  { title: "AI Command Centre", description: "Manage AI employees, assistant workflows, chatbot behaviour and execution oversight.", href: "/admin/ai-workforce", status: "available", icon: Bot, eyebrow: "Founder AI operations" },\n  { title: "Customer Support", description: "Open the support operations workspace to manage tickets, service levels and customer responses.", href: "/admin/support", status: "available", icon: LifeBuoy, eyebrow: "Support operations" },
];

export default function FounderApplicationLauncher({ adminBasePath }: { adminBasePath: string }) {
  const cards = items.map((item) => ({
    ...item,
    href: item.href?.startsWith("/admin") ? item.href.replace("/admin", adminBasePath) : item.href,
  }));
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-brand-cyan-400">Application launcher</p><h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">Your company environments</h3><p className="mt-1 text-sm text-[var(--text-muted)]">One entry point for the public website and internal operating applications.</p></div>
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/5 px-3 py-1.5 text-xs text-violet-300"><Sparkles size={14}/> Unified workspace</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ title, description, href, status, icon: Icon, eyebrow }) => {
          const content = <div className={`group h-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition ${status === "available" ? "hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-950/10" : "opacity-85"}`}>
            <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Icon size={21}/></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${status === "available" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>{status === "available" ? "Open application" : "Planned"}</span></div>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--text-muted)]">{eyebrow}</p><h4 className="mt-1 flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">{title}{status === "available" && <ArrowUpRight size={15} className="text-cyan-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>}</h4><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
          </div>;
          return href && status === "available" ? <Link key={title} href={href} className="block h-full">{content}</Link> : <div key={title}>{content}</div>;
        })}
      </div>
    </section>
  );
}
