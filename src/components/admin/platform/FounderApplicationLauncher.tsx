"use client";

import Link from "next/link";
import { ArrowUpRight, Globe2, LayoutDashboard, Building2, Users, Sparkles, Bot, Workflow, LifeBuoy } from "lucide-react";

type LauncherItem = {
  title: string;
  description: string;
  href: string;
  icon: typeof Globe2;
  eyebrow: string;
};

const items: LauncherItem[] = [
  { title: "Public Website", description: "Open the live TGO DevStudio website and its public-facing services.", href: "/", icon: Globe2, eyebrow: "Live environment" },
  { title: "Website Administration", description: "Manage website content, users, analytics and existing CMS operations.", href: "/admin/dashboard", icon: LayoutDashboard, eyebrow: "Existing administration" },
  { title: "Business Ecosystem", description: "Manage the shared directory of internal units, clients, partners and vendors.", href: "/admin/businesses", icon: Building2, eyebrow: "Business administration" },
  { title: "Client Portal", description: "Client accounts, profile settings, enquiries, notifications and relationship updates.", href: "/client/login", icon: Users, eyebrow: "Live client environment" },
  { title: "Workforce Portal", description: "Employee profile, assigned work, schedules, requests, reviews and team workspace.", href: "/workforce", icon: Workflow, eyebrow: "Live workforce environment" },
  { title: "AI Command Centre", description: "Manage AI employees, assistant workflows, chatbot behaviour and execution oversight.", href: "/admin/ai-workforce", icon: Bot, eyebrow: "Founder AI operations" },
  { title: "Customer Support", description: "Manage support tickets, service levels and customer responses.", href: "/admin/support", icon: LifeBuoy, eyebrow: "Support operations" },
];

export default function FounderApplicationLauncher({ adminBasePath }: { adminBasePath: string }) {
  const cards = items.map((item) => ({
    ...item,
    href: item.href.startsWith("/admin") ? item.href.replace("/admin", adminBasePath) : item.href,
  }));
  return <section className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-brand-cyan-400">Application launcher</p><h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">Your company environments</h3><p className="mt-1 text-sm text-[var(--text-muted)]">One entry point for the public website and internal operating applications.</p></div>
      <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/5 px-3 py-1.5 text-xs text-violet-300"><Sparkles size={14}/> Unified workspace</span>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ title, description, href, icon: Icon, eyebrow }) => <Link key={title} href={href} className="group block h-full">
        <div className="h-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-950/10">
          <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Icon size={21}/></span><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Open application</span></div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--text-muted)]">{eyebrow}</p><h4 className="mt-1 flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">{title}<ArrowUpRight size={15} className="text-cyan-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></h4><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
      </Link>)}
    </div>
  </section>;
}
