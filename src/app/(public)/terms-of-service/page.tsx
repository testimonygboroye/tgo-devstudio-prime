import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import PageContent from "@/models/PageContent";
import { PAGE_DEFAULTS } from "@/lib/constants/pageDefaults";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Terms of Service | TGO DevStudio Prime",
  description: "Terms governing use of the TGO DevStudio Prime website.",
};

export default async function TermsOfServicePage() {
  await connectToDatabase();
  const saved = await PageContent.findOne({ type: "terms-of-service" }).lean();
  const page = saved || PAGE_DEFAULTS["terms-of-service"];

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Legal</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">{page.title}</h1>
        <div
          className="prose prose-invert mt-10 max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(page.content) }}
        />
      </div>
    </main>
  );
}
