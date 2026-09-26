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
    if (data.status === "ok") setArticles(data.articles);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(query), 250);
    return () => clearTimeout(timeout);
  }, [query, load]);

  useEffect(() => {
    if (isLoading) return;
    try {
      const savedScroll = window.sessionStorage.getItem("help-return-scroll");
      if (savedScroll) {
        window.scrollTo({ top: parseInt(savedScroll, 10), behavior: "instant" as ScrollBehavior });
        window.sessionStorage.removeItem("help-return-scroll");
      }
    } catch {
      // ignore
    }
  }, [isLoading]);

  function handleOpenArticle(id: string) {
    try {
      window.sessionStorage.setItem("help-return-path", pathname);
      window.sessionStorage.setItem("help-return-scroll", String(window.scrollY));
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
    <main className="min-h-screen px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow-label">Help &amp; Guide</span>
        <h1
          className="heading-premium mt-3 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          How Can We Help?
        </h1>

        <div className="surface-card mt-9">
          <div className="surface-card-inner flex items-center gap-3 px-5 py-4">
            <Search size={18} style={{ color: "var(--text-muted)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full bg-transparent outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>

        {isLoading && <p className="mt-8" style={{ color: "var(--text-muted)" }}>Loading...</p>}
        {!isLoading && articles.length === 0 && (
          <p className="mt-8" style={{ color: "var(--text-muted)" }}>No articles found.</p>
        )}

        {!isLoading && Object.keys(grouped).length > 0 && (
          <div className="mt-12 space-y-10">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <span className="eyebrow-label">{category}</span>
                <div className="mt-5 space-y-3">
                  {items.map((article) => (
                    <button key={article._id} onClick={() => handleOpenArticle(article._id)} className="surface-card block w-full text-left">
                      <div className="surface-card-inner px-5 py-4" style={{ color: "var(--text-primary)" }}>
                        {article.title}
                      </div>
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
