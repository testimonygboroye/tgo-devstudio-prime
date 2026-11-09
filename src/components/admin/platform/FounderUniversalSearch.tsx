"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Command, Search, X, LoaderCircle, Building2, UserRound, ArrowUpRight } from "lucide-react";

type Result = { id: string; type: "organization" | "user"; title: string; subtitle: string; href: string };

export default function FounderUniversalSearch({ adminBasePath }: { adminBasePath: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSequence = useRef(0);

  useEffect(() => () => {
    requestSequence.current += 1;
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    requestSequence.current += 1;
    const sequence = requestSequence.current;
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults([]); setError(""); setLoading(false);
      return;
    }
    setLoading(true); setError("");
    timer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/platform/search?q=${encodeURIComponent(value.trim())}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Search is unavailable.");
        if (sequence === requestSequence.current) setResults(data.results || []);
      } catch (cause) {
        if (sequence === requestSequence.current) setError(cause instanceof Error ? cause.message : "Search is unavailable.");
      } finally {
        if (sequence === requestSequence.current) setLoading(false);
      }
    }, 250);
  }

  const hrefFor = (href: string) => `${adminBasePath}${href}`;
  return <section className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5 sm:p-6">
    <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Command size={19}/></span><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-brand-cyan-400">Command search</p><h3 className="text-lg font-bold text-[var(--text-primary)]">Find people and organizations</h3></div></div>
    <div className="relative mt-4"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"/><input value={query} onChange={(event) => handleQueryChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") handleQueryChange(""); if (event.key === "Enter" && results[0]) router.push(hrefFor(results[0].href)); }} placeholder="Search by name, email or organization…" className="input-premium w-full pl-10 pr-10" aria-label="Search platform records"/>{query && <button type="button" onClick={() => handleQueryChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-label="Clear search"><X size={16}/></button>}</div>
    {query.trim().length >= 2 && <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-subtle)]">{loading ? <p className="flex items-center gap-2 p-4 text-sm text-[var(--text-muted)]"><LoaderCircle size={15} className="animate-spin"/> Searching authorized records…</p> : error ? <p role="alert" className="p-4 text-sm text-rose-300">{error}</p> : results.length ? results.map((result) => <Link key={result.id} href={hrefFor(result.href)} className="flex items-center gap-3 border-b border-[var(--border-subtle)] p-3 last:border-0 hover:bg-[var(--surface-hover)]"><span className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">{result.type === "user" ? <UserRound size={16}/> : <Building2 size={16}/>}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{result.title}</span><span className="block truncate text-xs text-[var(--text-muted)]">{result.subtitle}</span></span><ArrowUpRight size={15} className="text-[var(--text-muted)]"/></Link>) : <p className="p-4 text-sm text-[var(--text-muted)]">No matching people or organizations were found.</p>}</div>}
    <p className="mt-3 text-xs text-[var(--text-muted)]">Search is limited to founder-authorized identity and organization records. Results do not expose private account data.</p>
  </section>;
}
