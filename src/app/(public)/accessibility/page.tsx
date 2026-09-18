import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import PageContent from "@/models/PageContent";
import { ACCESSIBILITY_DEFAULT } from "@/lib/constants/pageDefaults";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Accessibility Statement | TGO DevStudio Prime",
  description: "Our commitment to accessibility on this site.",
};

export default async function AccessibilityPage() {
  await connectToDatabase();
  const saved = await PageContent.findOne({ type: "accessibility" }).lean();
  const page = saved || ACCESSIBILITY_DEFAULT;

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow-label">Legal</span>
        <h1 className="heading-premium mt-3 text-4xl font-bold brand-gradient-text sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          {page.title}
        </h1>
        <div
          className="prose prose-invert mt-10 max-w-none"
          style={{ color: "var(--text-secondary)" }}
          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(page.content) }}
        />
      </div>
    </main>
  );
}
