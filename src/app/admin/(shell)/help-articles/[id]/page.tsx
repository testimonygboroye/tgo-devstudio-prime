import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import HelpArticle from "@/models/HelpArticle";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import HelpArticleForm from "@/components/admin/HelpArticleForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHelpArticlePage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanEdit(session!, "helpArticles");
  const { id } = await params;
  await connectToDatabase();
  const article = await HelpArticle.findById(id).lean();

  if (!article) {
    notFound();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Edit Help Article</h1>
      <div className="mt-8">
        <HelpArticleForm
          mode="edit"
          articleId={id}
          initialData={{
            title: article.title,
            bodyHtml: article.bodyHtml,
            visibility: article.visibility,
            requiredContentType: article.requiredContentType,
            category: article.category,
          }}
        />
      </div>
    </div>
  );
}
