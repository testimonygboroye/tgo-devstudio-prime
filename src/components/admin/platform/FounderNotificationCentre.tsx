"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ExternalLink, Inbox } from "lucide-react";

type Notification = { id: string; category: string; title: string; body: string; href: string | null; readAt: string | null; createdAt: string };

export default function FounderNotificationCentre({ initialNotifications, initialUnread }: { initialNotifications: Notification[]; initialUnread: number }) {
  const [items, setItems] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function markRead(id?: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/platform/notifications", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { markAllRead: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Notification status could not be updated.");
      setItems((current) => current.map((item) => !id || item.id === id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item));
      setUnread((count) => Math.max(0, count - data.modifiedCount));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Notification status could not be updated."); }
    finally { setBusy(false); }
  }

  return <section className="surface-card overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] p-5">
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Bell size={19}/></span><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-brand-cyan-400">Founder inbox</p><h3 className="text-lg font-bold text-[var(--text-primary)]">Notification centre <span className="ml-1 rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">{unread} unread</span></h3></div></div>
      <button type="button" disabled={busy || unread === 0} onClick={() => void markRead()} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] disabled:opacity-40"><CheckCheck size={15}/> Mark all read</button>
    </div>
    {error && <p role="alert" className="border-b border-rose-400/20 bg-rose-400/5 px-5 py-3 text-sm text-rose-300">{error}</p>}
    {items.length === 0 ? <div className="px-6 py-10 text-center"><Inbox size={28} className="mx-auto text-[var(--text-muted)]"/><p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">You’re all caught up</p><p className="mt-1 text-xs text-[var(--text-muted)]">Platform notifications will appear here when business events create them.</p></div> :
      <div className="divide-y divide-[var(--border-subtle)]">{items.map((item) => <article key={item.id} className={`flex gap-3 p-4 sm:px-5 ${item.readAt ? "opacity-70" : "bg-cyan-400/[.025]"}`}><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-slate-500" : "bg-cyan-300"}`}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h4><span className="rounded-full bg-[var(--bg-surface-2)] px-2 py-0.5 text-[10px] uppercase text-[var(--text-muted)]">{item.category}</span></div><p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{item.body}</p><p className="mt-2 text-[11px] text-[var(--text-muted)]">{new Date(item.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p></div><div className="flex shrink-0 flex-col items-end gap-2">{!item.readAt && <button type="button" disabled={busy} onClick={() => void markRead(item.id)} className="text-[11px] font-semibold text-cyan-300 hover:underline">Mark read</button>}{item.href && <Link href={item.href} className="text-cyan-300" aria-label={`Open ${item.title}`}><ExternalLink size={15}/></Link>}</div></article>)}</div>}
    <div className="border-t border-[var(--border-subtle)] px-5 py-3 text-[11px] text-[var(--text-muted)]">Showing the latest {items.length} notifications for your founder account.</div>
  </section>;
}
