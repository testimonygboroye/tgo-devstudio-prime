import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import PageContent from "@/models/PageContent";
import { ACCESSIBILITY_DEFAULT } from "@/lib/constants/pageDefaults";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getServerLocale());

  return {
    title: `Accessibility | TGO DevStudio Prime`,
    description: t("common.readMore"),
  };
}

export default async function AccessibilityPage() {
  await connectToDatabase();

  const locale = await getServerLocale();
  const t = createTranslator(locale);

  const saved = await PageContent.findOne({
    type: "accessibility",
  }).lean();

  const page = saved
    ? getLocalizedContent(saved, locale, ["title", "content"])
    : ACCESSIBILITY_DEFAULT;

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow-label">{t("nav.more")}</span>

        <h1
          className="heading-premium mt-3 text-4xl font-bold brand-gradient-text sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {page.title}
        </h1>

        <div
          className="prose prose-invert mt-10 max-w-none"
          style={{ color: "var(--text-secondary)" }}
          dangerouslySetInnerHTML={{
            __html: sanitizeBlogHtml(page.content),
          }}
        />
      </div>
    </main>
  );
}
