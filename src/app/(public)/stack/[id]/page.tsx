import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import StackItem from "@/models/StackItem";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getItem(id: string) {
  await connectToDatabase();
  try {
    return await StackItem.findOne({ _id: id, publishStatus: "published" }).lean();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) return { title: "Technology Not Found | TGO DevStudio Prime", robots: { index: false, follow: true } };
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/stack/${id}`;
  return {
    title: `${item.title} | Our Technology Stack | TGO DevStudio`,
    description: item.description,
    alternates: { canonical },
    openGraph: { url: canonical, title: item.title, description: item.description, type: "article", siteName: "TGO DevStudio", images: [{ url: `${siteUrl}/opengraph-image`, alt: "TGO DevStudio" }] },
    twitter: { card: "summary_large_image", title: item.title, description: item.description, images: [`${siteUrl}/opengraph-image`] },
  };
}

export default async function StackItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/stack/${id}`;
  const schema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: item.title, description: item.description, applicationCategory: item.category, url: canonical, publisher: { "@type": "Organization", name: "TGO DevStudio", url: siteUrl } };

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <article className="mx-auto max-w-3xl">
        <span className="eyebrow-label">{item.category}</span>
        <h1 className="heading-premium mt-3 text-4xl font-bold brand-gradient-text sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>{item.title}</h1>
        <div className="mt-8 rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <p className="whitespace-pre-wrap text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      </article>
    </main>
  );
}
