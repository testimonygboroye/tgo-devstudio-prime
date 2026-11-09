"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Eye, Users, MousePointerClick, MessageSquare, RefreshCw, Globe2, Smartphone } from "lucide-react";

type Row = { path?: string; views?: number; visitors?: number; country?: string; device?: string; source?: string; date?: string; eventName?: string; count?: number; metricName?: string; deviceType?: string; average?: number; worst?: number; samples?: number };
type AnalyticsData = {
  summary: { visitors: number; pageViews: number; sessions: number; pagesPerVisitor: number; contactSubmissions: number; newsletterSubscriptions?: number; completedBookings?: number; conversions: number };
  events: Row[]; webVitals: Row[]; topPages: Row[]; countries: Row[]; devices: Row[]; sources: Row[]; daily: Row[];
  range?: string; since?: string; until?: string;
};

const RANGE_OPTIONS = [
  { value: "1h", label: "Last hour" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "365d", label: "Last year" },
];

const EVENT_LABELS: Record<string, string> = {
  contact_form_submitted: "Contact form submissions",
  newsletter_subscribed: "Newsletter subscriptions",
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

function toLocalInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function MetricCard({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: typeof Eye; hint: string }) {
  return <article className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-sm sm:p-5">
    <div className="flex items-center justify-between gap-3"><span className="min-w-0 text-sm text-[var(--text-secondary)]">{label}</span><span className="shrink-0 rounded-xl bg-brand-cyan-400/10 p-2 text-brand-cyan-400"><Icon size={18}/></span></div>
    <p className="mt-4 break-words text-3xl font-bold tracking-tight text-[var(--text-primary)]">{value}</p>
    <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
  </article>;
}

function Rows({ title, rows, nameKey }: { title: string; rows: Row[]; nameKey: "path" | "country" | "device" | "source" }) {
  return <section className="min-w-0 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
    <h2 className="mb-4 break-words font-semibold text-[var(--text-primary)]">{title}</h2>
    {rows.length ? <div className="min-w-0 space-y-3">{rows.map((row, index) => {
      const name = row[nameKey] || "Unknown";
      const value = row.visitors ?? row.views ?? 0;
      const max = Math.max(...rows.map((item) => item.visitors ?? item.views ?? 0), 1);
      return <div key={String(name) + index} className="min-w-0">
        <div className="mb-1 flex min-w-0 items-start justify-between gap-3 text-sm"><span className="min-w-0 break-all text-[var(--text-secondary)]">{name}</span><span className="shrink-0 text-right font-medium text-[var(--text-primary)]">{value}{row.views !== undefined && row.visitors !== undefined ? ` visitors · ${row.views} views` : ""}</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]"><div className="h-full rounded-full brand-gradient-bg" style={{ width: `${Math.max(3, (value / max) * 100)}%` }}/></div>
      </div>;
    })}</div> : <p className="text-sm text-[var(--text-muted)]">No data recorded in this period yet.</p>}
  </section>;
}

export default function ConversionInsightsPage() {
  const [range, setRange] = useState("30d");
  const [customFrom, setCustomFrom] = useState(() => toLocalInputValue(new Date(Date.now() - 30 * 86400000)));
  const [customTo, setCustomTo] = useState(() => toLocalInputValue(new Date()));
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (range === "custom") {
        const from = new Date(customFrom);
        const to = new Date(customTo);
        if (!customFrom || !customTo || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
          throw new Error("Choose a valid start and end date/time. The end must be later than the start.");
        }
        params.set("from", from.toISOString());
        params.set("to", to.toISOString());
      } else {
        params.set("range", range);
      }
      const response = await fetch(`/api/analytics/events?${params.toString()}`, { cache: "no-store", credentials: "same-origin" });
      const result = await response.json();
      if (!response.ok || result.status !== "ok") throw new Error(result.message || (response.status === 401 ? "Please sign in to Command Deck to view analytics." : "Analytics could not be loaded."));
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analytics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [range, customFrom, customTo]);

  useEffect(() => { void load(); }, [load]);

  const summary = data?.summary;
  const isHourly = range === "1h" || range === "24h" || (range === "custom" && data?.daily.some((item) => (item.date || "").includes(":")));
  return <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden text-[var(--text-primary)]">
    <header className="flex min-w-0 flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan-400">TGO DevStudio · Command Deck</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Conversion Insights</h1><p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">Understand how visitors discover your pages and which actions turn attention into enquiries.</p></div>
      <button onClick={() => void load()} className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--text-secondary)]" aria-label="Refresh analytics"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/> Refresh</button>
    </header>

    <section className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Reporting period</h2><span className="text-xs text-[var(--text-muted)]">{data?.since ? `From ${new Date(data.since).toLocaleString()} to ${data.until ? new Date(data.until).toLocaleString() : "now"}` : "Choose a preset or an exact custom period"}</span></div>
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => setRange(option.value)} aria-pressed={range === option.value} className={`rounded-lg border px-3 py-2 text-sm transition-colors ${range === option.value ? "border-brand-cyan-400 bg-brand-cyan-400/10 text-brand-cyan-300" : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-brand-cyan-400/50"}`}>{option.label}</button>)}
        <button type="button" onClick={() => setRange("custom")} aria-pressed={range === "custom"} className={`rounded-lg border px-3 py-2 text-sm transition-colors ${range === "custom" ? "border-brand-cyan-400 bg-brand-cyan-400/10 text-brand-cyan-300" : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-brand-cyan-400/50"}`}>Custom range</button>
      </div>
      {range === "custom" && <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="min-w-0 text-xs font-medium text-[var(--text-secondary)]">From <input type="datetime-local" value={customFrom} max={customTo || undefined} onChange={(event) => setCustomFrom(event.target.value)} className="mt-1 block w-full min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--text-primary)]"/></label>
        <label className="min-w-0 text-xs font-medium text-[var(--text-secondary)]">To <input type="datetime-local" value={customTo} min={customFrom || undefined} max={toLocalInputValue(new Date())} onChange={(event) => setCustomTo(event.target.value)} className="mt-1 block w-full min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--text-primary)]"/></label>
        <button type="button" onClick={() => void load()} className="rounded-lg bg-brand-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950">Apply range</button>
      </div>}
    </section>

    {error && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{error}</div>}
    {loading && !data ? <div className="rounded-2xl border border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-secondary)]">Loading conversion analytics…</div> : null}

    {summary && <>
      <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Unique visitors" value={summary.visitors.toLocaleString()} icon={Users} hint="Public visitors; authenticated admin activity excluded"/>
        <MetricCard label="Page views" value={summary.pageViews.toLocaleString()} icon={Eye} hint="Recorded public page views"/>
        <MetricCard label="Sessions" value={summary.sessions.toLocaleString()} icon={BarChart3} hint="Sessions with at least one page view"/>
        <MetricCard label="Views per visitor" value={summary.pagesPerVisitor.toFixed(2)} icon={Globe2} hint="Average pages viewed by each visitor"/>
        <MetricCard label="Contact enquiries" value={summary.contactSubmissions.toLocaleString()} icon={MessageSquare} hint="Successfully submitted contact forms tracked from this release"/>
        <MetricCard label="Newsletter subscriptions" value={(summary.newsletterSubscriptions || 0).toLocaleString()} icon={MessageSquare} hint="New subscriptions and re-subscriptions"/>
        <MetricCard label="Completed bookings" value={(summary.completedBookings || 0).toLocaleString()} icon={BarChart3} hint="Calendly booking confirmations"/>
        <MetricCard label="Tracked conversions" value={summary.conversions.toLocaleString()} icon={MousePointerClick} hint="Contact submissions, subscriptions and completed bookings"/>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <h2 className="mb-4 font-semibold">Conversion and engagement events</h2>
          {data.events.length ? <div className="min-w-0 space-y-3">{data.events.map((event) => <div key={event.eventName} className="flex min-w-0 items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-3 last:border-0"><span className="min-w-0 break-words text-sm text-[var(--text-secondary)]">{EVENT_LABELS[event.eventName || ""] || event.eventName}</span><span className="shrink-0 font-semibold">{event.count}</span></div>)}</div> : <p className="text-sm text-[var(--text-muted)]">No conversion events yet. New clicks and successful contact submissions will appear here after deployment.</p>}
        </div>
        <section className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:col-span-2 sm:p-5">
          <h2 className="mb-2 font-semibold">Core Web Vitals · real-user performance</h2>
          <p className="mb-4 text-xs text-[var(--text-muted)]">Measurements start after this release. LCP, INP, CLS, FCP and TTFB are grouped by device type so mobile bottlenecks can be identified.</p>
          {data.webVitals.length ? <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-lg" data-horizontal-scroll role="region" aria-label="Scrollable Core Web Vitals table" tabIndex={0}><table className="w-full min-w-[560px] table-auto text-left text-sm"><thead className="text-xs text-[var(--text-muted)]"><tr><th className="pb-3 pr-4">Metric</th><th className="pb-3 pr-4">Device</th><th className="pb-3 pr-4">Average</th><th className="pb-3 pr-4">Worst</th><th className="pb-3">Samples</th></tr></thead><tbody>{data.webVitals.map((item, index) => <tr key={(item.metricName || "metric") + (item.deviceType || "device") + index} className="border-t border-[var(--border-subtle)]"><td className="py-3 pr-4 font-semibold">{item.metricName}</td><td className="py-3 pr-4 text-[var(--text-secondary)]">{item.deviceType || "Unknown"}</td><td className="py-3 pr-4">{item.average}{item.metricName === "CLS" ? "" : " ms"}</td><td className="py-3 pr-4">{item.worst}{item.metricName === "CLS" ? "" : " ms"}</td><td className="py-3">{item.samples}</td></tr>)}</tbody></table></div> : <p className="text-sm text-[var(--text-muted)]">No performance samples yet. Real-user measurements will appear after visitors load the updated site.</p>}
        </section>
        <Rows title="Top public pages" rows={data.topPages} nameKey="path"/>
        <Rows title="Visitor countries" rows={data.countries} nameKey="country"/>
        <Rows title="Devices" rows={data.devices} nameKey="device"/>
        <Rows title="Referral sources" rows={data.sources} nameKey="source"/>
        <section className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Smartphone size={17}/>{isHourly ? "Hourly public page views" : "Daily public page views"}</h2>
          {data.daily.length ? <div className="flex h-36 min-w-0 items-end gap-1 overflow-hidden">{data.daily.map((bucket) => {
            const max = Math.max(...data.daily.map((item) => item.views || 0), 1);
            return <div key={bucket.date} title={`${bucket.date}: ${bucket.views} views`} aria-label={`${bucket.date}: ${bucket.views} views`} className="min-w-0 flex-1 rounded-t-sm brand-gradient-bg" style={{ height: `${Math.max(3, ((bucket.views || 0) / max) * 100)}%` }}/>;
          })}</div> : <p className="text-sm text-[var(--text-muted)]">No page-view history for this period.</p>}
          <p className="mt-3 text-xs text-[var(--text-muted)]">{isHourly ? "Each bar represents one hour, oldest to newest." : "Each bar represents one day, oldest to newest."}</p>
        </section>
      </section>
      <p className="break-words text-xs text-[var(--text-muted)]">Analytics are privacy-conscious and do not expose visitor names, email addresses, phone numbers, or exact addresses. Contact details remain in the protected Messages/Contact area.</p>
    </>}
  </div>;
}
