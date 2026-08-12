"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";

interface ArticleResult {
  _id: string;
  title: string;
  category: string;
}

export default function HelpSearchPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArticleResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHelpPage = pathname === "/help" || pathname.startsWith("/help/");

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const res = await fetch(`/api/help-articles?q=${encodeURIComponent(term)}`);
    const data = await res.json();
    if (data.status === "ok") {
      setResults(data.articles);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 250);
    return () => clearTimeout(timeout);
  }, [query, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleOpenArticle(article: ArticleResult) {
    try {
      window.sessionStorage.setItem("help-return-path", pathname);
    } catch {
      // ignore storage errors
    }
    setIsOpen(false);
    setQuery("");
    router.push(`/help/${article._id}`);
  }

  if (isHelpPage) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Search help articles"
        className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-400 hover:bg-base-900 hover:text-neutral-100"
      >
        <Search size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-base-800 bg-base-900 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-base-800 p-3">
            <Search size={16} className="text-neutral-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles..."
              className="w-full bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
            />
            <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-neutral-300">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading && <p className="p-4 text-sm text-neutral-500">Searching...</p>}

            {!isLoading && query && results.length === 0 && (
              <p className="p-4 text-sm text-neutral-500">No articles found.</p>
            )}

            {!isLoading &&
              results.map((article) => (
                <button
                  key={article._id}
                  onClick={() => handleOpenArticle(article)}
                  className="block w-full border-b border-base-800 px-4 py-3 text-left text-sm text-neutral-100 last:border-0 hover:bg-base-800"
                >
                  <span className="block font-medium">{article.title}</span>
                  <span className="block text-xs text-neutral-500">{article.category}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
