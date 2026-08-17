"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ContactListItem {
  _id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-brand-cyan-400/20 text-brand-cyan-300",
  read: "bg-neutral-600/30 text-neutral-300",
  replied: "bg-green-500/20 text-green-300",
  archived: "bg-neutral-700/30 text-neutral-500",
};

const PAGE_SIZE = 10;

export default function ContactListClient() {
  const pathname = usePathname();
  const basePathSegment = `/${pathname.split("/").filter(Boolean)[0]}`;

  const [submissions, setSubmissions] = useState<ContactListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/contact?${params.toString()}`);
    const data = await res.json();

    if (data.status !== "ok") {
      setError(data.message || "Failed to load messages.");
      setIsLoading(false);
      return;
    }

    setSubmissions(data.submissions);
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const term = searchQuery.toLowerCase();
    return submissions.filter(
      (s) => s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term)
    );
  }, [submissions, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / PAGE_SIZE));
  const pageItems = filteredSubmissions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Contact Messages</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full max-w-xs rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {searchQuery && (
        <p className="mt-2 text-xs text-neutral-500">Showing results for "{searchQuery}"</p>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-neutral-400">Loading messages...</p>}

        {!isLoading && pageItems.length === 0 && (
          <p className="text-neutral-400">No messages match this filter.</p>
        )}

        {!isLoading &&
          pageItems.map((s) => (
            <Link
              key={s._id}
              href={`${basePathSegment}/contact/${s._id}`}
              className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-100">{s.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[s.status] || ""}`}>
                  {s.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-400">{s.email}</p>
              <p className="mt-1 text-sm text-neutral-500">
                {s.subject} · {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-md border border-base-800 px-3 py-1.5 text-neutral-100 hover:bg-base-900 disabled:pointer-events-none disabled:text-neutral-600"
          >
            ← Previous
          </button>
          <span className="text-neutral-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-base-800 px-3 py-1.5 text-neutral-100 hover:bg-base-900 disabled:pointer-events-none disabled:text-neutral-600"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
