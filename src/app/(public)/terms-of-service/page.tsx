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
  title: "Consumer Terms of Service | TGO DevStudio Prime",
  description: "The terms governing your access to and use of the TGO DevStudio Prime public website and visitor features.",
  alternates: { canonical: "/terms-of-service" },
  openGraph: { title: "Consumer Terms of Service | TGO DevStudio Prime", description: "The terms governing your access to and use of the TGO DevStudio Prime public website and visitor features.", url: "/terms-of-service", type: "article" },
  twitter: { card: "summary_large_image", title: "Consumer Terms of Service | TGO DevStudio Prime", description: "The terms governing your access to and use of the TGO DevStudio Prime public website and visitor features." },
};

export default async function LegalDocumentPage() {
  await connectToDatabase();
  const locale = await getServerLocale();
  const saved = await PageContent.findOne({ type: "terms-of-service" }).lean();
  const page = saved && saved.contentVersion === PAGE_CONTENT_VERSION
    ? getLocalizedContent(saved, locale, ["title", "content"])
    : PAGE_DEFAULTS["terms-of-service"];
  return <LegalPageShell title={page.title} eyebrow="TGO DevStudio · Legal" description="The terms governing your access to and use of the TGO DevStudio Prime public website and visitor features." content={page.content} currentPath="/terms-of-service" />;
}
