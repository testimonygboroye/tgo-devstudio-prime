import BlogPostForm from "@/components/admin/BlogPostForm";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanCreate } from "@/lib/auth/pageGuards";

export default async function NewBlogPostPage() {
  const session = await getServerSession();
  guardCanCreate(session!, "blogPosts");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">New Blog Post</h1>
      <div className="mt-8">
        <BlogPostForm mode="create" />
      </div>
    </div>
  );
}
