"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Eye, Users, MousePointerClick, MessageSquare, RefreshCw, Globe2, Smartphone, ExternalLink } from "lucide-react";

type Row = { path?: string; views?: number; visitors?: number; country?: string; device?: string; source?: string; date?: string; eventName?: string; count?: number };
type AnalyticsData = {
  summary: { visitors: number; pageViews: number; sessions: number; pagesPerVisitor: number; contactSubmissions: number; conversions: number };
  events: Row[]; topPages: Row[]; countries: Row[]; devices: Row[]; sources: Row[]; daily: Row[];
};

const EVENT_LABELS: Record<string, string> = {
  contact_form_submitted: "Contact form submissions",
  whatsapp_click: "WhatsApp clicks",
  email_click: "Email clicks",
  book_call_click: "Book-a-call clicks",
  calendly_event_scheduled: "Calendly bookings completed",
  contact_cta_click: "Contact CTA clicks",
  portfolio_click: "Portfolio project clicks",
  service_click: "Service page clicks",
  newsletter_signup_click: "Newsletter signup clicks",
  cta_click: "Other CTA clicks",
};

function MetricCard({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: typeof Eye; hint: string }) {
  return <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><span className="text-sm text-[var(--text-secondary)]">{label}</span><span className="rounded-xl bg-brand-cyan-400/10 p-2 text-brand-cyan-400"><Icon size={18}/></span></div>
    <p className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)]">{value}</p>
    <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
  </article>;
}

function Rows({ title, rows, nameKey }: { title: string; rows: Row[]; nameKey: "path" | "country" | "device" | "source" }) {
  return <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
    <h2 className="mb-4 font-semibold text-[var(--text-primary)]">{title}</h2>
    {rows.length ? <div className="space-y-3">{rows.map((row, index) => {
      const name = row[nameKey] || "Unknown";
      const value = row.visitors ?? row.views ?? 0;
      const max = Math.max(...rows.map((item) => item.visitors ?? item.views ?? 0), 1);
      return <div key={String(name) + index}>
        <div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate text-[var(--text-secondary)]">{name}</span><span className="shrink-0 font-medium text-[var(--text-primary)]">{value}{row.views !== undefined && row.visitors !== undefined ? ` visitors · ${row.views} views` : ""}</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]"><div className="h-full rounded-full brand-gradient-bg" style={{ width: `${Math.max(3, (value / max) * 100)}%` }}/></div>
      </div>;
    })}</div> : <p className="text-sm text-[var(--text-muted)]">No data recorded in this period yet.</p>}
  </section>;
}

export default function ConversionInsightsPage() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/analytics/events?range=${range}`, { cache: "no-store", credentials: "same-origin" });
      const result = await response.json();
      if (!response.ok || result.status !== "ok") throw new Error(result.message || (response.status === 401 ? "Please sign in to Command Deck to view analytics." : "Analytics could not be loaded."));
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analytics could not be loaded.");
    } finally { setLoading(false); }
  }, [range]);

  useEffect(() => { void load(); }, [load]);

  const summary = data?.summary;
  return <main className="min-h-screen space-y-6 bg-[var(--bg-base)] p-4 text-[var(--text-primary)] sm:p-6 lg:p-8">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan-400">TGO DevStudio · Command Deck</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Conversion Insights</h1><p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">Understand how visitors discover your pages and which actions turn attention into enquiries.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90, 365].map((days) => <button key={days} onClick={() => setRange(days)} className={`rounded-lg border px-3 py-2 text-sm ${range === days ? "border-brand-cyan-400 bg-brand-cyan-400/10 text-brand-cyan-300" : "border-[var(--border-subtle)] text-[var(--text-secondary)]"}`}>{days} days</button>)}
        <button onClick={() => void load()} className="rounded-lg border border-[var(--border-subtle)] p-2 text-[var(--text-secondary)]" aria-label="Refresh analytics"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/></button>
      </div>
    </header>

    {error && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{error}</div>}
    {loading && !data ? <div className="rounded-2xl border border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-secondary)]">Loading conversion analytics…</div> : null}

    {summary && <>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Unique visitors" value={summary.visitors.toLocaleString()} icon={Users} hint="Public visitors; authenticated admin activity excluded"/>
        <MetricCard label="Page views" value={summary.pageViews.toLocaleString()} icon={Eye} hint="Recorded public page views"/>
        <MetricCard label="Sessions" value={summary.sessions.toLocaleString()} icon={BarChart3} hint="Sessions with at least one page view"/>
        <MetricCard label="Views per visitor" value={summary.pagesPerVisitor.toFixed(2)} icon={Globe2} hint="Average pages viewed by each visitor"/>
        <MetricCard label="Contact enquiries" value={summary.contactSubmissions.toLocaleString()} icon={MessageSquare} hint="Successfully submitted contact forms tracked from now on"/>
        <MetricCard label="Tracked conversions" value={summary.conversions.toLocaleString()} icon={MousePointerClick} hint="Contact submissions plus completed Calendly bookings"/>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <h2 className="mb-4 font-semibold">Conversion and engagement events</h2>
          {data?.events.length ? <div className="space-y-3">{data.events.map((event) => <div key={event.eventName} className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-3 last:border-0"><span className="text-sm text-[var(--text-secondary)]">{EVENT_LABELS[event.eventName || ""] || event.eventName}</span><span className="font-semibold">{event.count}</span></div>)}</div> : <p className="text-sm text-[var(--text-muted)]">No conversion events yet. New clicks and successful contact submissions will appear here after deployment.</p>}
        </div>
        <Rows title="Top public pages" rows={data?.topPages || []} nameKey="path"/>
        <Rows title="Visitor countries" rows={data?.countries || []} nameKey="country"/>
        <Rows title="Devices" rows={data?.devices || []} nameKey="device"/>
        <Rows title="Referral sources" rows={data?.sources || []} nameKey="source"/>
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Smartphone size={17}/> Daily public page views</h2>
          {data?.daily.length ? <div className="flex h-36 items-end gap-1">{data.daily.map((day) => {
            const max = Math.max(...data.daily.map((item) => item.views || 0), 1);
            return <div key={day.date} title={`${day.date}: ${day.views} views`} className="min-w-0 flex-1 rounded-t-sm brand-gradient-bg" style={{ height: `${Math.max(3, ((day.views || 0) / max) * 100)}%` }}/>;
          })}</div> : <p className="text-sm text-[var(--text-muted)]">No page-view history for this period.</p>}
          <p className="mt-3 text-xs text-[var(--text-muted)]">Each bar represents one day, oldest to newest.</p>
        </section>
      </section>
      <p className="text-xs text-[var(--text-muted)]">Analytics are privacy-conscious and do not expose visitor names, email addresses, phone numbers, or exact addresses. Contact details remain in the protected Messages/Contact area. <a href="/api/analytics/events?range=30" className="ml-1 inline-flex items-center gap-1 text-brand-cyan-400">API <ExternalLink size={11}/></a></p>
    </>}
  </main>;
}
