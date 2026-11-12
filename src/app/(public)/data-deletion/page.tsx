import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import PageContent from "@/models/PageContent";
import { PAGE_DEFAULTS } from "@/lib/constants/pageDefaults";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { getLocalizedContent } from "@/lib/i18n/translationHelper";
import LegalPageShell from "@/components/public/LegalPageShell";
import DataDeletionRequestForm from "@/components/public/DataDeletionRequestForm";
import DataDeletionRequestTracker from "@/components/public/DataDeletionRequestTracker";

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
  const page = saved ? getLocalizedContent(saved, locale, ["title", "content"]) : PAGE_DEFAULTS["data-deletion"];
  return <>
    <LegalPageShell title={page.title} eyebrow="TGO DevStudio · Privacy & data rights" description="A clear, secure process for personal data rights and deletion requests." content={page.content} currentPath="/data-deletion" />
    <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-xl sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-500">Secure request form</p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Submit a privacy request</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">Provide enough information for our team to locate the relevant account or communication. We will verify your identity before disclosing or deleting personal information.</p>
        <div className="mt-6"><DataDeletionRequestForm/></div><div className="mt-8"><DataDeletionRequestTracker/></div>
      </div>
    </section>
  </>;
}
