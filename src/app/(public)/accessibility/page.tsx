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
  title: "Accessibility Statement | TGO DevStudio Prime",
  description: "Our ongoing commitment to accessible experiences and how to report a barrier or request assistance.",
  alternates: { canonical: "/accessibility" },
  openGraph: { title: "Accessibility Statement | TGO DevStudio Prime", description: "Our ongoing commitment to accessible experiences and how to report a barrier or request assistance.", url: "/accessibility", type: "article" },
  twitter: { card: "summary_large_image", title: "Accessibility Statement | TGO DevStudio Prime", description: "Our ongoing commitment to accessible experiences and how to report a barrier or request assistance." },
};

export default async function LegalDocumentPage() {
  await connectToDatabase();
  const locale = await getServerLocale();
  const saved = await PageContent.findOne({ type: "accessibility" }).lean();
  const page = saved && saved.contentVersion === PAGE_CONTENT_VERSION
    ? getLocalizedContent(saved, locale, ["title", "content"])
    : PAGE_DEFAULTS["accessibility"];
  return <LegalPageShell title={page.title} eyebrow="TGO DevStudio · Legal" description="Our ongoing commitment to accessible experiences and how to report a barrier or request assistance." content={page.content} currentPath="/accessibility" />;
}
