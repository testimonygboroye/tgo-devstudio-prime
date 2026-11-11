import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import StackItem from "@/models/StackItem";
import Link from "next/link";
import { Layers3, Database, Code2, Workflow } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Stack | TGO DevStudio Prime",
  description: "The technology stack behind TGO DevStudio Prime, and why we chose it.",
  alternates: { canonical: "/stack" },
};

export default async function StackPage() {
  await connectToDatabase();
  const items = await StackItem.find({ publishStatus: "published" }).sort({ category: 1, displayOrder: 1 }).lean();

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <main className="stack-page">
      <div className="mx-auto max-w-5xl">
        <span className="eyebrow-label">Engineering</span>
        <h1
          className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Our Stack
        </h1>
        <p className="mt-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Every technology choice on this site was made deliberately, with real trade-offs
          considered.
        </p>

        {Object.keys(grouped).length === 0 ? (
          <div className="mt-12 space-y-10">
<section><span className="eyebrow-label">Application engineering</span><div className="mt-5 grid gap-4 sm:grid-cols-2">
{[{name:"Next.js",role:"Full-stack application framework",detail:"Server-rendered routes, metadata, API endpoints and application delivery."},{name:"React",role:"Interactive user interfaces",detail:"Reusable components and responsive experiences across the public and admin applications."},{name:"TypeScript",role:"Typed application development",detail:"Static types help keep complex application features more predictable and maintainable."},{name:"Tailwind CSS",role:"Design system and styling",detail:"Utility-driven responsive layouts and shared visual patterns."}].map(x=><div key={x.name} className="surface-card"><div className="surface-card-inner p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-violet-600/15 text-brand-cyan-300"><Code2 size={19}/></span><h2 className="text-lg font-bold text-[var(--text-primary)]">{x.name}</h2></div><p className="mt-3 text-sm font-semibold text-brand-cyan-300">{x.role}</p><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{x.detail}</p></div></div>)}
</div></section>
<section><span className="eyebrow-label">Data, media &amp; delivery</span><div className="mt-5 grid gap-4 sm:grid-cols-2">
{[{name:"MongoDB Atlas + Mongoose",role:"Data persistence",detail:"Document storage and schema-backed application data."},{name:"Cloudinary",role:"Media infrastructure",detail:"Image and file storage, transformation and delivery."},{name:"Vercel",role:"Hosting and deployment",detail:"Production deployment, edge delivery and performance analytics."},{name:"Brevo",role:"Email delivery",detail:"Transactional messages and newsletter communications."},{name:"Cloudflare Turnstile",role:"Abuse prevention",detail:"Bot protection for supported public forms."},{name:"GitHub",role:"Source control",detail:"Versioned source code and collaborative software delivery."}].map(x=><div key={x.name} className="surface-card"><div className="surface-card-inner p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-cyan-400/10 text-brand-cyan-300"><Database size={19}/></span><h2 className="text-lg font-bold text-[var(--text-primary)]">{x.name}</h2></div><p className="mt-3 text-sm font-semibold text-brand-cyan-300">{x.role}</p><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{x.detail}</p></div></div>)}
</div></section>
<div className="rounded-3xl border border-brand-violet-500/25 bg-gradient-to-br from-brand-violet-600/15 to-brand-cyan-400/10 p-7"><div className="flex items-center gap-3"><Workflow className="text-brand-cyan-300"/><h2 className="text-xl font-bold text-[var(--text-primary)]">Technology is a means, not the outcome.</h2></div><p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">We select tools according to product requirements, reliability, maintainability, security and the needs of the people using the system. The technologies listed here reflect the current website codebase and supporting services; individual client projects may use a different stack.</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-cyan-300">Discuss a technical approach <Layers3 size={16}/></Link></div></div>
        ) : (
          <div className="mt-14 space-y-12">
            {Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category}>
                <span className="eyebrow-label">{category}</span>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {categoryItems.map((item) => (
                    <Link key={item._id.toString()} href={`/stack/${item._id.toString()}`} className="surface-card block transition hover:-translate-y-1">
                      <div className="surface-card-inner p-6">
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
                        <p className="mt-4 text-xs font-semibold text-brand-cyan-300">Explore technology →</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
