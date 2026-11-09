import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function PublicEmptyState({ eyebrow = "A new chapter", title, description, primaryHref = "/contact", primaryLabel = "Talk to our team", secondaryHref, secondaryLabel }: { eyebrow?: string; title: string; description: string; primaryHref?: string; primaryLabel?: string; secondaryHref?: string; secondaryLabel?: string }) {
  return <section className="surface-card mt-12 overflow-hidden">
    <div className="surface-card-inner relative overflow-hidden p-7 sm:p-10">
      <div className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full bg-brand-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-1/4 h-44 w-44 rounded-full bg-brand-cyan-400/10 blur-3xl" />
      <div className="relative z-10 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-cyan-400/25 bg-brand-cyan-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.18em] text-brand-cyan-300"><Sparkles size={13}/>{eyebrow}</span>
        <h2 className="heading-premium mt-5 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">{title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{description}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={primaryHref} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-base-950">{primaryLabel}<ArrowRight size={16}/></Link>
          {secondaryHref && secondaryLabel && <Link href={secondaryHref} className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[var(--text-primary)]">{secondaryLabel}<ArrowRight size={16}/></Link>}
        </div>
      </div>
    </div>
  </section>;
}
