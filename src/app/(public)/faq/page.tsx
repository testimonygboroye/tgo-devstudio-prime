import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";
import FaqAccordion from "./FaqAccordion";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "FAQ | TGO DevStudio Prime",
  description: "Frequently asked questions about TGO DevStudio.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  await connectToDatabase();
  const items = await FaqItem.find({ publishStatus: "published" }).sort({ category: 1, displayOrder: 1 }).lean();

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <main className="faq-page">
      <div className="home-container faq-content">
        <span className="eyebrow-label">Support</span>
        <h1
          className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Frequently Asked Questions
        </h1>

        {Object.keys(grouped).length === 0 ? (
          <div className="mt-12 space-y-4"><div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"><span className="eyebrow-label">Working with TGO</span><h2 className="mt-3 text-xl font-bold text-[var(--text-primary)]">What can TGO DevStudio help me build?</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">We work across custom software, websites, web applications, mobile apps, SaaS platforms, AI systems, cloud solutions, cybersecurity and tailored digital products. The right approach depends on your goals and requirements.</p></div><div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"><h2 className="text-xl font-bold text-[var(--text-primary)]">How do I start a project?</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">Send us a project enquiry or arrange a discovery call. We will discuss the problem, clarify scope and priorities, and provide a written proposal where there is a suitable fit. Work begins after the engagement is agreed.</p></div><div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"><h2 className="text-xl font-bold text-[var(--text-primary)]">How are project costs and timelines determined?</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">They depend on requirements, complexity, integrations, deliverables and schedule. We confirm the agreed scope, milestones and fees in the project proposal or engagement document.</p></div><div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"><h2 className="text-xl font-bold text-[var(--text-primary)]">Where can I get help or ask about my information?</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">Visit our <Link href="/help" className="text-brand-cyan-300 underline">Help Centre</Link> for support, or read the <Link href="/privacy-policy" className="text-brand-cyan-300 underline">Privacy Policy</Link> for information requests.</p></div><div className="rounded-3xl border border-brand-violet-500/25 bg-gradient-to-br from-brand-violet-600/15 to-brand-cyan-400/10 p-6 sm:p-8"><h2 className="text-xl font-bold text-[var(--text-primary)]">Still have a question?</h2><p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">Tell us what you need and the team will help direct your enquiry.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/contact" className="btn-premium-primary rounded-full px-5 py-3 text-sm font-bold text-base-950">Contact us</Link><Link href="/book-a-call" className="btn-premium-secondary rounded-full px-5 py-3 text-sm font-semibold text-[var(--text-primary)]">Book a call</Link></div></div></div>
        ) : (
          <div className="mt-14 space-y-10">
            {Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category}>
                <span className="eyebrow-label">{category}</span>
                <div className="mt-5 space-y-3">
                  {categoryItems.map((item) => (
                    <FaqAccordion key={item._id.toString()} item={{ _id: item._id.toString(), question: item.question, answer: item.answer }} />
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
