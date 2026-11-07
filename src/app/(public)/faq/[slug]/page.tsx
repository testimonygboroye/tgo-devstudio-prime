import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getFaq(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectToDatabase();
  return FaqItem.findOne({ _id: id, publishStatus: "published" }).lean();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getServerLocale();
  const { slug } = await params;
  const rawFaq = await getFaq(slug);

  if (!rawFaq) {
    return {
      title: "FAQ Not Found | TGO DevStudio Prime",
      robots: { index: false, follow: true },
    };
  }

  const faq = getLocalizedContent(rawFaq, locale, TRANSLATABLE_FIELDS.FaqItem);
  const title = `${faq.question} | TGO DevStudio FAQ`;
  const description = String(faq.answer || "").replace(/\s+/g, " ").slice(0, 160);
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/faq/${slug}`;
  const fallbackImage = `${siteUrl}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title,
      description,
      type: "article",
      siteName: "TGO DevStudio",
      images: [{ url: fallbackImage, alt: "TGO DevStudio" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fallbackImage],
    },
  };
}

export default async function FaqDetailPage({ params }: PageProps) {
  const locale = await getServerLocale();
  const { slug } = await params;
  const rawFaq = await getFaq(slug);

  if (!rawFaq) notFound();

  const faq = getLocalizedContent(rawFaq, locale, TRANSLATABLE_FIELDS.FaqItem);

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <article className="mx-auto max-w-3xl">
        <Link href="/faq" className="text-sm font-semibold text-brand-cyan-300 hover:text-brand-cyan-200">
          ← Back to FAQs
        </Link>
        <span className="eyebrow-label mt-8 block">{faq.category || "Support"}</span>
        <h1 className="heading-premium mt-3 text-4xl font-bold brand-gradient-text sm:text-5xl">
          {faq.question}
        </h1>
        <div className="mt-10 rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <p className="whitespace-pre-wrap text-base leading-8" style={{ color: "var(--text-secondary)" }}>
            {faq.answer}
          </p>
        </div>
      </article>
    </main>
  );
}
