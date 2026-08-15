"use client";

import { useState, useEffect, useCallback } from "react";

interface MessageItem {
  _id: string;
  type: string;
  title: string;
  body: string;
  relatedId?: string;
  status: "new" | "read" | "unread" | "archived";
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-brand-cyan-400/20 text-brand-cyan-300",
  read: "bg-neutral-600/30 text-neutral-300",
  unread: "bg-amber-500/20 text-amber-300",
  archived: "bg-neutral-700/30 text-neutral-500",
};

export default function MessagesClient() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/messages?${params.toString()}`);
    const data = await res.json();
    if (data.status === "ok") setMessages(data.messages);
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function handleDecision(message: MessageItem, decision: "accept" | "reject") {
    if (!message.relatedId) return;
    setDecidingId(message._id);
    await fetch(`/api/role-change-requests/${message.relatedId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    await updateStatus(message._id, "read");
    setDecidingId(null);
  }

  return (
    <div className="max-w-xl">
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100"
        >
          <option value="">All</option>
          <option value="new">New</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-neutral-400">Loading...</p>}
        {!isLoading && messages.length === 0 && <p className="text-neutral-400">No messages match this filter.</p>}

        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`rounded-lg border p-4 ${
              msg.status === "new" ? "border-brand-cyan-400/50 bg-base-900" : "border-base-800 bg-base-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-100">{msg.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[msg.status]}`}>
                {msg.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-400">{msg.body}</p>
            <p className="mt-2 text-xs text-neutral-500">{new Date(msg.createdAt).toLocaleString()}</p>

            {msg.type === "roleChangeRequest" && msg.relatedId && msg.status !== "read" && msg.status !== "archived" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleDecision(msg, "accept")}
                  disabled={decidingId === msg._id}
                  className="rounded-md brand-gradient-bg px-3 py-1.5 text-xs font-semibold text-base-950 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecision(msg, "reject")}
                  disabled={decidingId === msg._id}
                  className="rounded-md border border-red-500/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {(msg.status === "new" || msg.status === "unread") && (
                <button onClick={() => updateStatus(msg._id, "read")} className="text-xs text-brand-cyan-300 hover:underline">
                  Mark as read
                </button>
              )}
              {msg.status === "read" && (
                <button onClick={() => updateStatus(msg._id, "unread")} className="text-xs text-amber-300 hover:underline">
                  Mark as unread
                </button>
              )}
              {msg.status !== "archived" && (
                <button onClick={() => updateStatus(msg._id, "archived")} className="text-xs text-neutral-500 hover:underline">
                  Archive
                </button>
              )}
              {msg.status === "archived" && (
                <button onClick={() => updateStatus(msg._id, "read")} className="text-xs text-neutral-500 hover:underline">
                  Restore
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
