"use client";

import { useState, useEffect, useCallback } from "react";

interface Subscriber {
  _id: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function NewsletterClient() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [statusFilter, setStatusFilter] = useState("subscribed");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/newsletter?${params.toString()}`);
    const data = await res.json();
    if (data.status === "ok") setSubscribers(data.subscribers);
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function handleExportCsv() {
    const rows = [["Email", "Status", "Subscribed On"]];
    subscribers.forEach((s) => rows.push([s.email, s.status, new Date(s.createdAt).toLocaleDateString()]));
    const csv = rows.map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100"
        >
          <option value="">All</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <button
          onClick={handleExportCsv}
          className="rounded-md border border-base-800 px-3 py-2 text-sm text-neutral-100 hover:bg-base-900"
        >
          Export CSV
        </button>
        <span className="text-sm text-neutral-500">{subscribers.length} total</span>
      </div>

      <div className="mt-6 space-y-2">
        {isLoading && <p className="text-neutral-400">Loading...</p>}
        {!isLoading && subscribers.length === 0 && <p className="text-neutral-400">No subscribers yet.</p>}
        {!isLoading &&
          subscribers.map((s) => (
            <div key={s._id} className="flex items-center justify-between rounded-md border border-base-800 bg-base-900 p-3 text-sm">
              <span className="text-neutral-100">{s.email}</span>
              <span className="text-xs text-neutral-500">
                {s.status} · {new Date(s.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
