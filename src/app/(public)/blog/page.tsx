import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { getPubliclyVisibleFilter } from "@/lib/utils/blogVisibility";
import BrandPlaceholder from "@/components/public/BrandPlaceholder";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog | TGO DevStudio Prime",
  description: "Insights on software engineering, product, and building with TGO DevStudio.",
  openGraph: {
    title: "Blog | TGO DevStudio Prime",
    description: "Insights on software engineering, product, and building with TGO DevStudio.",
    type: "website",
  },
};

export default async function BlogListPage() {
  await connectToDatabase();
  const posts = await BlogPost.find(getPubliclyVisibleFilter())
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Blog</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">Insights</h1>

        {posts.length === 0 && <p className="mt-12 text-neutral-400">New posts are on the way.</p>}

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post._id.toString()}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-xl border border-base-800 bg-base-900 transition-colors hover:border-brand-cyan-400"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                {post.coverImage?.url ? (
                  <Image
                    src={post.coverImage.url}
                    alt={post.coverImage.altText}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <BrandPlaceholder label={post.title} />
                )}
              </div>
              <div className="p-5">
                <h2 className="text-lg font-semibold text-neutral-100 group-hover:text-brand-cyan-300">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{post.excerpt}</p>
                <p className="mt-3 text-xs font-semibold text-brand-cyan-300">Read article →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
