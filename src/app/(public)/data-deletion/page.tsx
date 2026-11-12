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
  title: "Personal Data Deletion | TGO DevStudio",
  description: "Learn how to request access to, correction of, or deletion of personal information held by TGO DevStudio.",
  alternates: { canonical: "/data-deletion" },
  openGraph: { title: "Personal Data Deletion | TGO DevStudio", description: "How to submit and track a personal data deletion request.", url: "/data-deletion", type: "article", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "TGO DevStudio Prime" }] },
  robots: { index: true, follow: true },
};

export default async function DataDeletionPage() {
  await connectToDatabase();
  const locale = await getServerLocale();
  const saved = await PageContent.findOne({ type: "data-deletion" }).lean();
  const page = saved
    ? getLocalizedContent(saved, locale, ["title", "content"])
    : PAGE_DEFAULTS["data-deletion"];
  return <LegalPageShell title={page.title} eyebrow="TGO DevStudio · Privacy & data rights" description="A clear, secure process for personal data rights and deletion requests." content={page.content} currentPath="/data-deletion" />;
}
