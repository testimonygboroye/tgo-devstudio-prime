import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getFaq(id: string) {
  await connectToDatabase();
  try {
    return await FaqItem.findOne({ _id: id, publishStatus: "published" }).lean();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const faq = await getFaq(id);
  if (!faq) return { title: "FAQ Not Found | TGO DevStudio Prime", robots: { index: false, follow: true } };
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/faq/${id}`;
  const description = faq.answer.slice(0, 160);
  return {
    title: `${faq.question} | TGO DevStudio FAQ`,
    description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title: faq.question,
      description,
      type: "article",
      siteName: "TGO DevStudio",
      images: [{ url: `${siteUrl}/opengraph-image`, alt: "TGO DevStudio" }],
    },
    twitter: { card: "summary_large_image", title: faq.question, description, images: [`${siteUrl}/opengraph-image`] },
  };
}

export default async function FaqDetailPage({ params }: PageProps) {
  const { id } = await params;
  const faq = await getFaq(id);
  if (!faq) notFound();
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/faq/${id}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Question",
    name: faq.question,
    text: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
    url: canonical,
  };

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <article className="mx-auto max-w-3xl">
        <span className="eyebrow-label">{faq.category || "Support"}</span>
        <h1 className="heading-premium mt-3 text-4xl font-bold brand-gradient-text sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          {faq.question}
        </h1>
        <div className="mt-8 rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <p className="whitespace-pre-wrap text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>{faq.answer}</p>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      </article>
    </main>
  );
}
