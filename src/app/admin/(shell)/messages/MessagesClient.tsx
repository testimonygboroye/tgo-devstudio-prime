"use client";

import { useState, useEffect } from "react";

interface MessageItem {
  _id: string;
  type: string;
  title: string;
  body: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export default function MessagesClient() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const res = await fetch("/api/messages");
    const data = await res.json();
    if (data.status === "ok") setMessages(data.messages);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/messages/${id}`, { method: "PATCH" });
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
    await markRead(message._id);
    setDecidingId(null);
    load();
  }

  return (
    <div className="max-w-xl">
      {isLoading && <p className="text-neutral-400">Loading...</p>}
      {!isLoading && messages.length === 0 && <p className="text-neutral-400">No messages.</p>}
      <div className="space-y-3">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`rounded-lg border p-4 ${
              msg.isRead ? "border-base-800 bg-base-900" : "border-brand-cyan-400/50 bg-base-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-100">{msg.title}</span>
              {!msg.isRead && (
                <span className="rounded-full bg-brand-cyan-400/20 px-2 py-0.5 text-xs text-brand-cyan-300">
                  New
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-400">{msg.body}</p>
            <p className="mt-2 text-xs text-neutral-500">{new Date(msg.createdAt).toLocaleString()}</p>

            {msg.type === "roleChangeRequest" && msg.relatedId && (
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

            {!msg.isRead && msg.type !== "roleChangeRequest" && (
              <button
                onClick={() => markRead(msg._id)}
                className="mt-3 text-xs text-brand-cyan-300 hover:underline"
              >
                Mark as read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
