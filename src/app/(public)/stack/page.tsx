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
  const items = await StackItem.find({ publishStatus: "published" })
    .sort({ category: 1, displayOrder: 1 })
    .lean();

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Engineering</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">Our Stack</h1>
        <p className="mt-4 text-neutral-100/70">
          Every technology choice on this site was made deliberately, with real trade-offs
          considered.
        </p>

        {Object.keys(grouped).length === 0 ? (
          <p className="mt-10 text-neutral-400">Stack details are coming soon.</p>
        ) : (
          <div className="mt-10 space-y-10">
            {Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold uppercase tracking-widest text-brand-cyan-300">
                  {category}
                </h2>
                <div className="mt-4 space-y-4">
                  {categoryItems.map((item) => (
                    <div key={item._id.toString()} className="rounded-lg border border-base-800 bg-base-900 p-4">
                      <p className="font-semibold text-neutral-100">{item.title}</p>
                      <p className="mt-1 text-sm text-neutral-400">{item.description}</p>
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
