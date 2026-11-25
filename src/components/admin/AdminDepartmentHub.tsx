import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminDepartmentHubItem = {
  label: string;
  description: string;
  hrefSuffix: string;
  icon: LucideIcon;
  founderOnly?: boolean;
  publicHref?: string;
};

export type AdminDepartmentHubSection = {
  title: string;
  description?: string;
  items: AdminDepartmentHubItem[];
};

export default function AdminDepartmentHub({
  basePath,
  title,
  eyebrow,
  description,
  sections,
  isFounder = false,
}: {
  basePath: string;
  title: string;
  eyebrow: string;
  description: string;
  sections: AdminDepartmentHubSection[];
  isFounder?: boolean;
}) {
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.founderOnly || isFounder),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <main className="mx-auto max-w-7xl space-y-8 pb-12">
      <header className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-violet-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-cyan-300">{eyebrow}</p>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
          </div>
          <Link href={`${basePath}/dashboard`} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:border-brand-cyan-400/40 hover:text-[var(--text-primary)]">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
        </div>
      </header>

      {visibleSections.map((section) => (
        <section key={section.title} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{section.title}</h2>
            {section.description && <p className="mt-1 text-sm text-[var(--text-muted)]">{section.description}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.items.map((item) => {
              const Icon = item.icon;
              const href = item.publicHref && !isFounder ? item.publicHref : `${basePath}${item.hrefSuffix}`;
              return (
                <Link key={item.hrefSuffix} href={href} className="group flex min-h-36 items-start gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-cyan-400/40 hover:bg-[var(--bg-surface-2)] hover:shadow-xl hover:shadow-brand-violet-950/10">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-cyan-400/15 bg-brand-cyan-400/10 text-brand-cyan-300"><Icon size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">{item.label}</span>
                      <ArrowRight size={16} className="shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-brand-cyan-300" />
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-[var(--text-secondary)]">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
