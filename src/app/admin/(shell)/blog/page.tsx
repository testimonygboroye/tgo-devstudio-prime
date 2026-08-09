import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import { getAdminBasePath } from "@/lib/adminPath";

export default async function BlogListPage() {
  const session = await getServerSession();
  guardCanView(session!, "blogPosts");
  await connectToDatabase();
  const posts = await BlogPost.find().sort({ createdAt: -1 }).lean();
  const basePath = getAdminBasePath();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
          <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Blog</h1>
        </div>
        <Link
          href={`${basePath}/blog/new`}
          className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950"
        >
          New Post
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {posts.length === 0 && <p className="text-neutral-400">No blog posts yet.</p>}
        {posts.map((post) => (
          <Link
            key={post._id.toString()}
            href={`${basePath}/blog/${post._id.toString()}`}
            className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-100">{post.title}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  post.publishStatus === "published"
                    ? "bg-brand-cyan-400/20 text-brand-cyan-300"
                    : post.publishStatus === "scheduled"
                    ? "bg-brand-violet-600/20 text-brand-violet-500"
                    : "bg-neutral-600/30 text-neutral-400"
                }`}
              >
                {post.publishStatus === "scheduled" && post.scheduledFor
                  ? `scheduled: ${new Date(post.scheduledFor).toLocaleString()}`
                  : post.publishStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-400">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
