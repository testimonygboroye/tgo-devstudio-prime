import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import PageContent from "@/models/PageContent";
import { PAGE_DEFAULTS } from "@/lib/constants/pageDefaults";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Stack | TGO DevStudio Prime",
  description: "The technology stack behind TGO DevStudio Prime, and why we chose it.",
};

export default async function StackPage() {
  await connectToDatabase();
  const saved = await PageContent.findOne({ type: "stack" }).lean();
  const page = saved || PAGE_DEFAULTS.stack;

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Engineering</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">{page.title}</h1>
        <div
          className="prose prose-invert mt-10 max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(page.content) }}
        />
      </div>
    </main>
  );
}
