"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { X } from "lucide-react";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";

interface Article {
  title: string;
  bodyHtml: string;
  category: string;
}

export default function HelpArticleViewerPage() {
  const router = useRouter();
  const params = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/help-articles/${params.id}`);
        const data = await res.json();
        if (data.status !== "ok") {
          setError(data.message || "Article not found.");
          setIsLoading(false);
          return;
        }
        setArticle(data.article);
      } catch {
        setError("Failed to load article.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  function handleClose() {
    let returnPath = "/";
    try {
      returnPath = window.sessionStorage.getItem("help-return-path") || "/";
    } catch {
      // ignore
    }
    router.push(returnPath);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-base-800 bg-base-950 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            {article && (
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan-300">
                {article.category}
              </p>
            )}
            <h1 className="mt-1 text-2xl font-bold text-neutral-100">
              {isLoading ? "Loading..." : article?.title || "Not Found"}
            </h1>
          </div>
          <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-100">
            <X size={22} />
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {article && (
          <div
            className="prose prose-invert mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(article.bodyHtml) }}
          />
        )}
      </div>
    </div>
  );
}
