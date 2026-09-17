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
  const items = await FaqItem.find({ publishStatus: "published" }).sort({ category: 1, displayOrder: 1 }).lean();

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-2xl">
        <span className="eyebrow-label">Support</span>
        <h1
          className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Frequently Asked Questions
        </h1>

        {Object.keys(grouped).length === 0 ? (
          <p className="mt-14" style={{ color: "var(--text-muted)" }}>FAQs are coming soon.</p>
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
