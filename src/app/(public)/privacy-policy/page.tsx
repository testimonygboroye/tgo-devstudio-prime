import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import PageContent from "@/models/PageContent";
import { PAGE_DEFAULTS } from "@/lib/constants/pageDefaults";
import { PAGE_CONTENT_VERSION } from "@/lib/constants/legalContent";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { getLocalizedContent } from "@/lib/i18n/translationHelper";
import LegalPageShell from "@/components/public/LegalPageShell";
import { AI_PRIVACY_SECTION } from "@/lib/migrateLegalPages";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Privacy Policy | TGO DevStudio Prime",
  description: "Understand what information TGO DevStudio collects, why it is used, how it is protected and the choices available to you.",
  alternates: { canonical: "/privacy-policy" },
  openGraph: { title: "Privacy Policy | TGO DevStudio Prime", description: "Understand what information TGO DevStudio collects, why it is used, how it is protected and the choices available to you.", url: "/privacy-policy", type: "article", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "TGO DevStudio Prime" }] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"], title: "Privacy Policy | TGO DevStudio Prime", description: "Understand what information TGO DevStudio collects, why it is used, how it is protected and the choices available to you." },
};

export default async function LegalDocumentPage() {
  await connectToDatabase();
  const locale = await getServerLocale();
  const saved = await PageContent.findOne({ type: "privacy-policy" }).lean();
  const page = saved && saved.contentVersion === PAGE_CONTENT_VERSION
    ? getLocalizedContent(saved, locale, ["title", "content"])
    : PAGE_DEFAULTS["privacy-policy"];
  const updatedNotice = "The Services include the public website, authenticated client portal, project and support workspaces, payment and invoice features, connected communication channels and AI-assisted help features where enabled. Internal workforce and administration tools are used by authorised personnel.";
  const outdatedNotice = "New products, a client portal, account workspace or payment service may require an additional notice before launch.";
  let content = page.content.replace(outdatedNotice, updatedNotice);
  if (!content.includes("<h2>AI assistants and automated support</h2>")) content += "\\n" + AI_PRIVACY_SECTION;
  return <LegalPageShell title={page.title} eyebrow="TGO DevStudio · Legal" description="Understand what information TGO DevStudio collects, why it is used, how it is protected and the choices available to you." content={content} currentPath="/privacy-policy" />;
}
