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
  title: "Privacy Policy | TGO DevStudio Prime",
  description: "Understand what information TGO DevStudio collects, why it is used, how it is protected and the choices available to you.",
  alternates: { canonical: "/privacy-policy" },
  openGraph: { title: "Privacy Policy | TGO DevStudio Prime", description: "Understand what information TGO DevStudio collects, why it is used, how it is protected and the choices available to you.", url: "/privacy-policy", type: "article" },
  twitter: { card: "summary_large_image", title: "Privacy Policy | TGO DevStudio Prime", description: "Understand what information TGO DevStudio collects, why it is used, how it is protected and the choices available to you." },
};

export default async function LegalDocumentPage() {
  await connectToDatabase();
  const locale = await getServerLocale();
  const saved = await PageContent.findOne({ type: "privacy-policy" }).lean();
  const page = saved && saved.contentVersion === PAGE_CONTENT_VERSION
    ? getLocalizedContent(saved, locale, ["title", "content"])
    : PAGE_DEFAULTS["privacy-policy"];
  return <LegalPageShell title={page.title} eyebrow="TGO DevStudio · Legal" description="Understand what information TGO DevStudio collects, why it is used, how it is protected and the choices available to you." content={page.content} currentPath="/privacy-policy" />;
}
