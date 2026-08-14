import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";
import FaqAccordion from "./FaqAccordion";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "FAQ | TGO DevStudio Prime",
  description: "Frequently asked questions about TGO DevStudio.",
};

export default async function FaqPage() {
  await connectToDatabase();
  const items = await FaqItem.find({ publishStatus: "published" })
    .sort({ category: 1, displayOrder: 1 })
    .lean();

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Support</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">
          Frequently Asked Questions
        </h1>

        {Object.keys(grouped).length === 0 ? (
          <p className="mt-10 text-neutral-400">FAQs are coming soon.</p>
        ) : (
          <div className="mt-10 space-y-8">
            {Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category}>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-cyan-300">
                  {category}
                </h2>
                <div className="mt-3 space-y-2">
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
