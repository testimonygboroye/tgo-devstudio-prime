"use client";

import { useState, useEffect, useCallback } from "react";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface Subscriber {
  _id: string;
  email: string;
  status: string;
  createdAt: string;
}

const BROADCAST_ENABLED = process.env.NEXT_PUBLIC_NEWSLETTER_BROADCAST_ENABLED !== "false";

export default function NewsletterClient() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [statusFilter, setStatusFilter] = useState("subscribed");
  const [isLoading, setIsLoading] = useState(true);

  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p>Write your update here...</p>");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState("");
  const [sendError, setSendError] = useState("");

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

  async function handleSendBroadcast() {
    setSendError("");
    setSendResult("");

    const confirmed = window.confirm(
      "This will send an email to every active subscriber right now. This cannot be undone. Continue?"
    );
    if (!confirmed) return;

    setIsSending(true);
    const res = await fetch("/api/newsletter/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, bodyHtml }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSendError(data.message || "Failed to send broadcast.");
      setIsSending(false);
      return;
    }

    setSendResult(data.message);
    setIsSending(false);
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
        <button
          onClick={() => BROADCAST_ENABLED && setShowCompose((prev) => !prev)}
          disabled={!BROADCAST_ENABLED}
          className="rounded-md brand-gradient-bg px-3 py-2 text-sm font-semibold text-base-950"
        >
          {showCompose ? "Cancel" : "Compose Broadcast"}
        </button>
        <span className="text-sm text-neutral-500">{subscribers.length} total</span>
      </div>

      {showCompose && (
        <div className="mt-6 max-w-2xl space-y-4 rounded-lg border border-base-800 bg-base-900 p-4">
          <div>
            <label className="block text-sm text-neutral-400">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-md border border-base-800 bg-base-950 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400">Message</label>
            <div className="mt-1">
              <RichTextEditor content={bodyHtml} onChange={setBodyHtml} />
            </div>
          </div>
          {sendError && <p className="text-sm text-red-400">{sendError}</p>}
          {sendResult && <p className="text-sm text-brand-cyan-300">{sendResult}</p>}
          <button
            onClick={handleSendBroadcast}
            disabled={isSending || !subject || !bodyHtml}
            className="rounded-md brand-gradient-bg px-5 py-2 text-sm font-semibold text-base-950 disabled:opacity-60"
          >
            {isSending ? "Sending..." : "Send to All Subscribers"}
          </button>
        </div>
      )}

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
