import Link from "next/link";
import { ShieldCheck, FileText, Accessibility, ArrowUpRight, Clock3 } from "lucide-react";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";

const related = [
  { href: "/privacy-policy", label: "Privacy Policy", note: "How information is handled", Icon: ShieldCheck },
  { href: "/terms-of-service", label: "Consumer Terms", note: "The website agreement", Icon: FileText },
  { href: "/usage-policy", label: "Usage Policy", note: "Acceptable use and security", Icon: ShieldCheck },
  { href: "/accessibility", label: "Accessibility", note: "Access and assistance", Icon: Accessibility },
];

export default function LegalPageShell({ title, eyebrow, description, content, currentPath }: { title: string; eyebrow: string; description: string; content: string; currentPath: string }) {
  return <main className="legal-page min-h-screen overflow-hidden pb-20">
    <section className="relative border-b border-[var(--border-subtle)] px-5 pb-12 pt-16 sm:px-10 sm:pb-16 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_10%,rgba(91,46,232,.22),transparent_42%),radial-gradient(ellipse_at_82%_22%,rgba(46,197,240,.14),transparent_38%)]" />
      <div className="mx-auto max-w-6xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan-400/25 bg-brand-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-brand-cyan-300"><ShieldCheck size={14}/>{eyebrow}</div>
        <h1 className="heading-premium mt-6 max-w-4xl text-4xl font-bold leading-[1.04] text-[var(--text-primary)] sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">{description}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]"><span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2"><Clock3 size={14}/> Last reviewed 9 November 2026</span><span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2">TGO DevStudio · Nigeria</span></div>
      </div>
    </section>
    <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
      <article className="legal-document min-w-0 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-7 shadow-[0_24px_80px_-45px_rgba(46,197,240,.28)] sm:px-9 sm:py-10" dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(content) }} />
      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-cyan-400">Legal centre</p><h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">Related documents</h2><div className="mt-4 space-y-2">{related.map(({href,label,note,Icon}) => <Link key={href} href={href} aria-current={currentPath===href ? "page" : undefined} className={`group flex items-center gap-3 rounded-2xl border p-3 transition-all ${currentPath===href ? "border-brand-cyan-400/50 bg-brand-cyan-400/10" : "border-[var(--border-subtle)] hover:border-brand-cyan-400/40 hover:bg-[var(--surface-hover)]"}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-violet-600/15 text-brand-cyan-300"><Icon size={18}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span><span className="mt-0.5 block text-xs text-[var(--text-muted)]">{note}</span></span><ArrowUpRight size={15} className="text-[var(--text-muted)]"/></Link>)}</div></div>
        <div className="rounded-3xl border border-brand-violet-500/25 bg-gradient-to-br from-brand-violet-600/15 to-brand-cyan-400/10 p-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-cyan-300">Need help?</p><h2 className="mt-2 text-lg font-bold text-[var(--text-primary)]">Talk to our team</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">If you have a question about this document or need assistance, contact TGO DevStudio.</p><a href="mailto:testimonygboroye.dev@gmail.com" className="mt-4 inline-flex items-center gap-2 rounded-xl brand-gradient-bg px-4 py-2.5 text-sm font-bold text-white shadow-lg">Contact support <ArrowUpRight size={15}/></a></div>
      </aside>
    </div>
  </main>;
}
