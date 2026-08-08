import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import User from "@/models/User";
import { getPubliclyVisibleFilter } from "@/lib/utils/blogVisibility";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";

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

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <article className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Blog</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">{post.title}</h1>
        <p className="mt-3 text-sm text-neutral-400">
          {author ? `By ${author.name}` : ""} · {new Date(post.createdAt).toLocaleDateString()}
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
      </article>
    </main>
  );
}
