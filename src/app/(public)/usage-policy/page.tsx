import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import PageContent from "@/models/PageContent";
import { PAGE_DEFAULTS } from "@/lib/constants/pageDefaults";
import { PAGE_CONTENT_VERSION } from "@/lib/constants/legalContent";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { getLocalizedContent } from "@/lib/i18n/translationHelper";
import LegalPageShell from "@/components/public/LegalPageShell";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Website Usage Policy | TGO DevStudio Prime",
  description: "The standards for safe, lawful and responsible use of TGO DevStudio Prime and its public-facing features.",
  alternates: { canonical: "/usage-policy" },
  openGraph: { title: "Website Usage Policy | TGO DevStudio Prime", description: "The standards for safe, lawful and responsible use of TGO DevStudio Prime and its public-facing features.", url: "/usage-policy", type: "article", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "TGO DevStudio Prime" }] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"], title: "Website Usage Policy | TGO DevStudio Prime", description: "The standards for safe, lawful and responsible use of TGO DevStudio Prime and its public-facing features." },
};

export default async function LegalDocumentPage() {
  await connectToDatabase();
  const locale = await getServerLocale();
  const saved = await PageContent.findOne({ type: "usage-policy" }).lean();
  const page = saved && saved.contentVersion === PAGE_CONTENT_VERSION
    ? getLocalizedContent(saved, locale, ["title", "content"])
    : PAGE_DEFAULTS["usage-policy"];
  return <LegalPageShell title={page.title} eyebrow="TGO DevStudio · Legal" description="The standards for safe, lawful and responsible use of TGO DevStudio Prime and its public-facing features." content={page.content} currentPath="/usage-policy" />;
}
