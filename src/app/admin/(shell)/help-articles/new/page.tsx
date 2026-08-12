import HelpArticleForm from "@/components/admin/HelpArticleForm";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanCreate } from "@/lib/auth/pageGuards";

export default async function NewHelpArticlePage() {
  const session = await getServerSession();
  guardCanCreate(session!, "helpArticles");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">New Help Article</h1>
      <div className="mt-8">
        <HelpArticleForm mode="create" />
      </div>
    </div>
  );
}
