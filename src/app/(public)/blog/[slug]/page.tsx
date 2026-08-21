import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import User from "@/models/User";
import { getPubliclyVisibleFilter } from "@/lib/utils/blogVisibility";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import { calculateReadingTime } from "@/lib/utils/readingTime";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  await connectToDatabase();
  return BlogPost.findOne({ slug, ...getPubliclyVisibleFilter() }).lean();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Post Not Found | TGO DevStudio Prime" };
  }

  const title = post.metaTitle || `${post.title} | TGO DevStudio Prime`;
  const description = post.metaDescription || post.excerpt;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: post.coverImage?.url ? [{ url: post.coverImage.url }] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const author = await User.findById(post.createdBy).select("name").lean();
  const safeHtml = sanitizeBlogHtml(post.contentHtml);
  const readingMinutes = calculateReadingTime(post.contentHtml);

  const relatedPosts =
    post.tags.length > 0
      ? await BlogPost.find({
          _id: { $ne: post._id },
          tags: { $in: post.tags },
          ...getPubliclyVisibleFilter(),
        })
          .select("title slug excerpt")
          .limit(3)
          .lean()
      : [];

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <article className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Blog</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">{post.title}</h1>
        <p className="mt-3 text-sm text-neutral-400">
          {author ? `By ${author.name}` : ""} · {new Date(post.createdAt).toLocaleDateString()} ·{" "}
          {readingMinutes} min read
        </p>

        {post.coverImage?.url && (
          <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-base-900 sm:h-96">
            <Image
              src={post.coverImage.url}
              alt={post.coverImage.altText}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
        )}

        <div
          className="prose prose-invert mt-10 max-w-none"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />

        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <span key={tag} className="rounded-full border border-base-800 px-2 py-0.5 text-xs text-neutral-400">
                {tag}
              </span>
            ))}
          </div>
        )}

        {relatedPosts.length > 0 && (
          <div className="mt-14 border-t border-base-800 pt-10">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Related Posts
            </h2>
            <div className="mt-4 space-y-3">
              {relatedPosts.map((related) => (
                <Link
                  key={related._id.toString()}
                  href={`/blog/${related.slug}`}
                  className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
                >
                  <p className="font-semibold text-neutral-100">{related.title}</p>
                  <p className="mt-1 text-sm text-neutral-400">{related.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
