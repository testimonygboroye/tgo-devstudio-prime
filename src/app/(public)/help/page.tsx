"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";

interface Article {
  _id: string;
  title: string;
  category: string;
}

export default function HelpIndexPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (term: string) => {
    setIsLoading(true);
    const res = await fetch(`/api/help-articles${term ? `?q=${encodeURIComponent(term)}` : ""}`);
    const data = await res.json();
    if (data.status === "ok") {
      setArticles(data.articles);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(query), 250);
    return () => clearTimeout(timeout);
  }, [query, load]);

  function handleOpenArticle(id: string) {
    try {
      window.sessionStorage.setItem("help-return-path", pathname);
    } catch {
      // ignore
    }
    router.push(`/help/${id}`);
  }

  const grouped = articles.reduce<Record<string, Article[]>>((acc, article) => {
    if (!acc[article.category]) acc[article.category] = [];
    acc[article.category].push(article);
    return acc;
  }, {});

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Help &amp; Guide</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">
          How Can We Help?
        </h1>

        <div className="mt-8 flex items-center gap-3 rounded-lg border border-base-800 bg-base-900 px-4 py-3">
          <Search size={18} className="text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-transparent text-neutral-100 outline-none placeholder:text-neutral-500"
          />
        </div>

        {isLoading && <p className="mt-8 text-neutral-400">Loading...</p>}

        {!isLoading && articles.length === 0 && (
          <p className="mt-8 text-neutral-400">No articles found.</p>
        )}

        {!isLoading && Object.keys(grouped).length > 0 && (
          <div className="mt-10 space-y-8">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-cyan-300">
                  {category}
                </h2>
                <div className="mt-3 space-y-2">
                  {items.map((article) => (
                    <button
                      key={article._id}
                      onClick={() => handleOpenArticle(article._id)}
                      className="block w-full rounded-lg border border-base-800 bg-base-900 p-4 text-left text-neutral-100 hover:border-brand-cyan-400"
                    >
                      {article.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
