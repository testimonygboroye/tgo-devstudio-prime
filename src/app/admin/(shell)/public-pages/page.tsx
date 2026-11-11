import Link from "next/link";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import { getAdminBasePath } from "@/lib/adminPath";
import { ArrowUpRight, Building2, Handshake } from "lucide-react";

export default async function PublicLandingPagesHub() {
  const session = await getServerSession();
  guardCanEdit(session!, "pageContent");
  const basePath = getAdminBasePath();
  const pages = [
    { key: "industries", title: "Industries", description: "Edit the industry landing page, sector cards, iconography, descriptions and calls to action.", icon: Building2 },
    { key: "engagement-models", title: "Engagement Models", description: "Edit the ways of working page, engagement cards, delivery descriptions and calls to action.", icon: Handshake },
  ];
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Website Content · Landing pages</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Public Landing Pages</h1>
      <p className="mt-2 max-w-3xl text-sm text-neutral-400">Manage the content and SEO for the additional public pages introduced in Phase 15.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {pages.map((page) => { const Icon = page.icon; return <Link key={page.key} href={basePath + "/public-pages/" + page.key} className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 transition hover:-translate-y-1 hover:border-cyan-400/50">
          <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-cyan-300"><Icon size={21}/></span><ArrowUpRight size={18} className="text-neutral-500 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan-300"/></div>
          <h2 className="mt-5 text-lg font-bold text-neutral-100">{page.title}</h2><p className="mt-2 text-sm leading-relaxed text-neutral-400">{page.description}</p>
          <span className="mt-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-semibold text-cyan-300">Edit page content</span>
        </Link>; })}
      </div>
    </div>
  );
}
