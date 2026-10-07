import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import User from "@/models/User";
import { getPubliclyVisibleFilter } from "@/lib/utils/blogVisibility";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import { calculateReadingTime } from "@/lib/utils/readingTime";
import ImageLightbox from "@/components/shared/ImageLightbox";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import {
  createTranslator,
  getLocalizedContent,
} from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import { getSiteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  try {
    await connectToDatabase();

    return await BlogPost.findOne({
      slug,
      ...getPubliclyVisibleFilter(),
    }).lean();
  } catch (error) {
    console.error("[TGO Blog] Failed to load blog post:", error);
    return null;
  }
}

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerLocale();
  const rawPost = await getPost(slug);

  if (!rawPost) {
    return {
      title: "Post Not Found | TGO DevStudio Prime",
      description:
        "The requested TGO DevStudio blog post could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const post = getLocalizedContent(
    rawPost,
    locale,
    TRANSLATABLE_FIELDS.BlogPost
  );

  const title =
    post.metaTitle ||
    `${post.title} | TGO DevStudio Prime`;

  const description = (
    post.metaDescription ||
    post.excerpt ||
    "Insights from TGO DevStudio on software engineering, digital products, AI, cloud and technology."
  ).slice(0, 160);

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/blog/${post.slug}`;

  return {
    title,
    description,

    keywords: Array.isArray(post.tags)
      ? post.tags
      : undefined,

    alternates: {
      canonical,
    },

    openGraph: {
      url: canonical,
      title,
      description,
      type: "article",
      siteName: "TGO DevStudio",
      publishedTime: post.createdAt
        ? new Date(post.createdAt).toISOString()
        : undefined,
      modifiedTime: post.updatedAt
        ? new Date(post.updatedAt).toISOString()
        : undefined,
      images: post.coverImage?.url
        ? [
            {
              url: post.coverImage.url,
              alt:
                post.coverImage.altText ||
                post.title,
            },
          ]
        : [
            {
              url: `${siteUrl}/opengraph-image`,
              alt:
                "TGO DevStudio Prime — Premium Software Engineering",
            },
          ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        post.coverImage?.url ||
          `${siteUrl}/opengraph-image`,
      ],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: PageProps) {
  const locale = await getServerLocale();
  const t = createTranslator(locale);

  const { slug } = await params;
  const rawPost = await getPost(slug);

  if (!rawPost) {
    notFound();
  }

  const post = getLocalizedContent(
    rawPost,
    locale,
    TRANSLATABLE_FIELDS.BlogPost
  );

  const tags = Array.isArray(post.tags)
    ? post.tags
    : [];

  const contentHtml =
    typeof post.contentHtml === "string"
      ? post.contentHtml
      : "";

  let author: { name?: string } | null = null;

  if (
    post.createdBy &&
    Types.ObjectId.isValid(String(post.createdBy))
  ) {
    try {
      author = await User.findById(post.createdBy)
        .select("name")
        .lean();
    } catch (error) {
      console.error(
        "[TGO Blog] Failed to load author:",
        error
      );
    }
  }

  let safeHtml = "";

  try {
    safeHtml = sanitizeBlogHtml(contentHtml);
  } catch (error) {
    console.error(
      "[TGO Blog] Failed to sanitize blog HTML:",
      error
    );

    safeHtml = contentHtml
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const readingMinutes =
    calculateReadingTime(contentHtml);

  let relatedPosts: typeof rawPost[] = [];

  if (tags.length > 0) {
    try {
      relatedPosts = await BlogPost.find({
        _id: { $ne: post._id },
        tags: { $in: tags },
        ...getPubliclyVisibleFilter(),
      })
        .select(
          "title slug excerpt translations createdAt updatedAt"
        )
        .limit(3)
        .lean();
    } catch (error) {
      console.error(
        "[TGO Blog] Failed to load related posts:",
        error
      );
    }
  }

  const localizedRelatedPosts =
    relatedPosts.map((related) =>
      getLocalizedContent(
        related,
        locale,
        TRANSLATABLE_FIELDS.BlogPost
      )
    );

  const coverImageUrl =
    typeof post.coverImage?.url === "string"
      ? post.coverImage.url
      : "";

  const coverImageAlt =
    post.coverImage?.altText ||
    post.title ||
    "TGO DevStudio blog image";

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/blog/${post.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${canonical}#article`,
    headline: post.title,
    description:
      post.metaDescription ||
      post.excerpt ||
      undefined,
    url: canonical,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "TGO DevStudio",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icons/icon-512x512.png`,
      },
    },
    author: author?.name
      ? {
          "@type": "Person",
          name: author.name,
        }
      : {
          "@type": "Organization",
          name: "TGO DevStudio",
        },
    datePublished: post.createdAt
      ? new Date(post.createdAt).toISOString()
      : undefined,
    dateModified: post.updatedAt
      ? new Date(post.updatedAt).toISOString()
      : undefined,
    image: coverImageUrl
      ? [coverImageUrl]
      : [`${siteUrl}/opengraph-image`],
    keywords: tags,
    inLanguage: locale,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "TGO DevStudio",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("nav.blog"),
        item: `${siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: canonical,
      },
    ],
  };

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(articleSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbSchema),
        }}
      />

      <article className="mx-auto max-w-2xl">
        <span className="eyebrow-label">
          {t("nav.blog")}
        </span>

        <h1
          className="heading-premium mt-3 text-4xl font-bold brand-gradient-text sm:text-5xl"
          style={{
            fontFamily: "var(--font-display)",
          }}
        >
          {post.title}
        </h1>

        <p
          className="mt-3 text-sm"
          style={{
            color: "var(--text-muted)",
          }}
        >
          {author
            ? `${t("common.by")} ${author.name}`
            : ""}
          {" · "}
          {new Date(
            post.createdAt
          ).toLocaleDateString(locale)}
          {" · "}
          {readingMinutes}{" "}
          {t("blog.minRead")}
        </p>

        {coverImageUrl && (
          <div className="mt-8">
            <ImageLightbox
              src={coverImageUrl}
              alt={coverImageAlt}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl}
                alt={coverImageAlt}
                className="w-full rounded-xl"
              />
            </ImageLightbox>
          </div>
        )}

        <div
          className="prose prose-invert mt-10 max-w-none"
          style={{
            color: "var(--text-secondary)",
          }}
          dangerouslySetInnerHTML={{
            __html: safeHtml,
          }}
        />

        {tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border px-2 py-0.5 text-xs"
                style={{
                  borderColor:
                    "var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {localizedRelatedPosts.length > 0 && (
          <div
            className="mt-16 border-t pt-10"
            style={{
              borderColor:
                "var(--border-subtle)",
            }}
          >
            <h2
              className="text-sm font-semibold uppercase tracking-widest"
              style={{
                color: "var(--text-muted)",
              }}
            >
              {t("blog.relatedPosts")}
            </h2>

            <div className="mt-5 space-y-3">
              {localizedRelatedPosts.map(
                (related) => (
                  <Link
                    key={related._id.toString()}
                    href={`/blog/${related.slug}`}
                    className="surface-card block"
                  >
                    <div className="surface-card-inner p-5">
                      <p
                        className="font-semibold"
                        style={{
                          color:
                            "var(--text-primary)",
                        }}
                      >
                        {related.title}
                      </p>

                      <p
                        className="mt-1 text-sm"
                        style={{
                          color:
                            "var(--text-secondary)",
                        }}
                      >
                        {related.excerpt}
                      </p>
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
