import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import StackItem from "@/models/StackItem";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Stack | TGO DevStudio Prime",
  description: "The technology stack behind TGO DevStudio Prime, and why we chose it.",
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
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-3xl">
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
          <p className="mt-14" style={{ color: "var(--text-muted)" }}>Stack details are coming soon.</p>
        ) : (
          <div className="mt-14 space-y-12">
            {Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category}>
                <span className="eyebrow-label">{category}</span>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {categoryItems.map((item) => (
                    <div key={item._id.toString()} className="surface-card">
                      <div className="surface-card-inner p-6">
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
                      </div>
                    </div>
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
