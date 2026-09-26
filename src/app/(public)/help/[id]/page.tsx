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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4" onClick={handleClose}>
      <div className="surface-card max-h-[85vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="surface-card-inner p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              {article && <span className="eyebrow-label">{article.category}</span>}
              <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {isLoading ? "Loading..." : article?.title || "Not Found"}
              </h1>
            </div>
            <button onClick={handleClose} style={{ color: "var(--text-muted)" }}>
              <X size={22} />
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          {article && (
            <div
              className="prose prose-invert mt-7 max-w-none"
              style={{ color: "var(--text-secondary)" }}
              dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(article.bodyHtml) }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
