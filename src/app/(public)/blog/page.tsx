import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { getPubliclyVisibleFilter } from "@/lib/utils/blogVisibility";
import BrandPlaceholder from "@/components/public/BrandPlaceholder";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import PublicEmptyState from "@/components/public/PublicEmptyState";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog | TGO DevStudio Prime",
  description: "Insights on software engineering, product, and building with TGO DevStudio.",
  alternates: { canonical: "/blog" },
};

export default async function BlogListPage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);

  await connectToDatabase();

  const rawPosts = await BlogPost.find(getPubliclyVisibleFilter())
    .sort({ createdAt: -1 })
    .lean();

  const posts = rawPosts.map((post) =>
    getLocalizedContent(post, locale, TRANSLATABLE_FIELDS.BlogPost)
  );

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <span className="eyebrow-label">{t("nav.blog")}</span>

        <h1
          className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("blog.title")}
        </h1>

        <p
          className="mt-4 max-w-2xl leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {t("blog.subtitle")}
        </p>

        {posts.length === 0 && (
          <PublicEmptyState eyebrow="Studio insights" title="New perspectives are being prepared." description="Our articles explore software engineering, product decisions, practical technology and the craft of building dependable digital experiences. In the meantime, explore our capabilities or talk with the team." primaryHref="/services" primaryLabel="Explore services" secondaryHref="/contact" secondaryLabel="Talk to TGO" />
        )}

        <div className="mt-14 grid gap-7 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post._id.toString()}
              href={`/blog/${post.slug}`}
              className="surface-card group block"
            >
              <div className="surface-card-inner">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
                  {post.coverImage?.url ? (
                    <Image
                      src={post.coverImage.url}
                      alt={post.coverImage.altText}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <BrandPlaceholder label={post.title} />
                  )}
                </div>

                <div className="p-7">
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {post.title}
                  </h2>

                  <p
                    className="mt-2 line-clamp-2 text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {post.excerpt}
                  </p>

                  <p className="mt-4 text-xs font-semibold text-brand-cyan-300">
                    {t("blog.readArticle")}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
