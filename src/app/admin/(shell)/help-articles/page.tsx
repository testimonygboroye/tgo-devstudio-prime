import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import HelpArticle from "@/models/HelpArticle";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import { getAdminBasePath } from "@/lib/adminPath";

export default async function HelpArticlesListPage() {
  const session = await getServerSession();
  guardCanView(session!, "helpArticles");
  await connectToDatabase();
  const articles = await HelpArticle.find().sort({ category: 1, title: 1 }).lean();
  const basePath = getAdminBasePath();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
          <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Help Articles</h1>
        </div>
        <Link
          href={`${basePath}/help-articles/new`}
          className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950"
        >
          New Article
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {articles.length === 0 && <p className="text-neutral-400">No help articles yet.</p>}
        {articles.map((article) => (
          <Link
            key={article._id.toString()}
            href={`${basePath}/help-articles/${article._id.toString()}`}
            className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-100">{article.title}</span>
              <span className="rounded-full bg-neutral-600/30 px-2 py-0.5 text-xs text-neutral-300">
                {article.visibility}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-400">{article.category}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
