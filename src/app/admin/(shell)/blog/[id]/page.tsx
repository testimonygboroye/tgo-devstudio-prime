import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import BlogPostForm from "@/components/admin/BlogPostForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanEdit(session!, "blogPosts");
  const { id } = await params;
  await connectToDatabase();
  const post = await BlogPost.findById(id).lean();

  if (!post) {
    notFound();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Edit Blog Post</h1>
      <div className="mt-8">
        <BlogPostForm
          mode="edit"
          postId={id}
          initialData={{
            title: post.title,
            excerpt: post.excerpt,
            contentHtml: post.contentHtml,
            coverImage: post.coverImage,
            tags: post.tags,
            publishStatus: post.publishStatus,
            scheduledFor: post.scheduledFor ? new Date(post.scheduledFor).toISOString() : undefined,
          }}
        />
      </div>
    </div>
  );
}
