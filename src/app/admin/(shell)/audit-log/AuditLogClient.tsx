"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  _id: string;
  actorName: string;
  method: string;
  path: string;
  action: string;
  createdAt: string;
}

export default function AuditLogClient() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/audit-log");
      const data = await res.json();
      if (data.status === "ok") setLogs(data.logs);
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      {isLoading && <p className="text-neutral-400">Loading...</p>}
      {!isLoading && logs.length === 0 && <p className="text-neutral-400">No actions logged yet.</p>}
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log._id} className="rounded-md border border-base-800 bg-base-900 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-100">{log.actorName}</span>
              <span className="text-xs text-neutral-500">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-neutral-400">{log.action}</p>
            <p className="mt-1 font-mono text-xs text-neutral-600">
              {log.method} {log.path}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
