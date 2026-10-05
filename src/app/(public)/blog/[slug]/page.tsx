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

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  await connectToDatabase();

  return BlogPost.findOne({
    slug,
    ...getPubliclyVisibleFilter(),
  }).lean();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getServerLocale();
  const { slug } = await params;
  const rawPost = await getPost(slug);

  if (!rawPost) {
    return {
      title: "Post Not Found | TGO DevStudio Prime",
      description:
        "The requested TGO DevStudio blog post could not be found.",
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

  const description =
    post.metaDescription ||
    post.excerpt ||
    "Insights from TGO DevStudio on software engineering, digital products, AI, cloud and technology.";

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      type: "article",
      images: post.coverImage?.url
        ? [{ url: post.coverImage.url }]
        : undefined,
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

  let author = null;

  if (
    post.createdBy &&
    Types.ObjectId.isValid(String(post.createdBy))
  ) {
    author = await User.findById(post.createdBy)
      .select("name")
      .lean();
  }

  const safeHtml =
    sanitizeBlogHtml(contentHtml);

  const readingMinutes =
    calculateReadingTime(contentHtml);

  const relatedRawPosts =
    tags.length > 0
      ? await BlogPost.find({
          _id: { $ne: post._id },
          tags: { $in: tags },
          ...getPubliclyVisibleFilter(),
        })
          .select(
            "title slug excerpt translations"
          )
          .limit(3)
          .lean()
      : [];

  const relatedPosts =
    relatedRawPosts.map((related) =>
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

  return (
    <main className="min-h-screen px-6 py-20 sm:px-12">
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

        {relatedPosts.length > 0 && (
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
              {relatedPosts.map((related) => (
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
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
