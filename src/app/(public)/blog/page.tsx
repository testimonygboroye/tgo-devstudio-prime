import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { getPubliclyVisibleFilter } from "@/lib/utils/blogVisibility";

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

        <div className="mt-12 space-y-8">
          {posts.map((post) => (
            <Link
              key={post._id.toString()}
              href={`/blog/${post.slug}`}
              className="group flex gap-5 rounded-xl border border-base-800 bg-base-900 p-5 hover:border-brand-cyan-400"
            >
              {post.coverImage?.url && (
                <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={post.coverImage.url}
                    alt={post.coverImage.altText}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-neutral-100 group-hover:text-brand-cyan-300">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-neutral-400">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
