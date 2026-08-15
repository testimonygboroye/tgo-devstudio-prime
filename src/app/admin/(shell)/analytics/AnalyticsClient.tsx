"use client";

import { useState, useEffect } from "react";

interface ViewEntry {
  _id: string;
  path: string;
  visitorId: string;
  userAgent: string;
  referrer?: string;
  createdAt: string;
}

function detectDevice(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return "Mobile";
  if (/tablet|ipad/i.test(userAgent)) return "Tablet";
  return "Desktop";
}

export default function AnalyticsClient() {
  const [views, setViews] = useState<ViewEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [uniqueVisitorCount, setUniqueVisitorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/analytics/page-views");
      const data = await res.json();
      if (data.status === "ok") {
        setViews(data.views);
        setTotalCount(data.totalCount);
        setUniqueVisitorCount(data.uniqueVisitorCount);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-base-800 bg-base-900 p-4">
          <p className="text-2xl font-bold text-neutral-100">{totalCount}</p>
          <p className="text-xs text-neutral-500">Total page views</p>
        </div>
        <div className="rounded-lg border border-base-800 bg-base-900 p-4">
          <p className="text-2xl font-bold text-neutral-100">{uniqueVisitorCount}</p>
          <p className="text-xs text-neutral-500">Unique visitors</p>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-neutral-500">
        Recent Activity
      </h2>
      {isLoading && <p className="mt-2 text-neutral-400">Loading...</p>}
      <div className="mt-3 space-y-2">
        {views.map((view) => (
          <div key={view._id} className="rounded-md border border-base-800 bg-base-900 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-neutral-100">{view.path}</span>
              <span className="text-xs text-neutral-500">{new Date(view.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {detectDevice(view.userAgent)} · Visitor {view.visitorId.slice(0, 8)}
              {view.referrer ? ` · from ${view.referrer}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
