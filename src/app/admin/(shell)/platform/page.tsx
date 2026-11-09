import Link from "next/link";
import {
  Activity, ArrowUpRight, Bell, Blocks, CheckCircle2, CircleAlert,
  Clock3, Database, Fingerprint, Gauge, Layers3, ShieldCheck, Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import { connectToDatabase } from "@/lib/db";
import { getPlatformRuntimeConfig } from "@/lib/platform/config";
import { PLATFORM_MODULE_REGISTRY } from "@/platform/registry/modules";
import BusinessMembership from "@/models/BusinessMembership";
import BusinessRole from "@/models/BusinessRole";
import PlatformAuditEvent from "@/models/PlatformAuditEvent";
import PlatformEvent from "@/models/PlatformEvent";
import PlatformNotification from "@/models/PlatformNotification";

export const dynamic = "force-dynamic";

const numberFormat = new Intl.NumberFormat("en");

function MetricCard({
  label, value, detail, icon: Icon, tone = "violet",
}: {
  label: string; value: number; detail: string;
  icon: typeof Activity; tone?: "violet" | "cyan" | "amber" | "emerald";
}) {
  const tones = {
    violet: "bg-violet-500/10 text-violet-300 ring-violet-400/20",
    cyan: "bg-cyan-500/10 text-cyan-300 ring-cyan-400/20",
    amber: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
    emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
  };
  return (
    <article className="surface-card group rounded-2xl border border-[var(--border-subtle)] p-5 transition-all hover:-translate-y-0.5 hover:border-brand-cyan-400/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)]">{numberFormat.format(value)}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{detail}</p>
        </div>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon size={20} />
        </span>
      </div>
    </article>
  );
}

export default async function FounderControlCentrePage() {
  const session = await getServerSession();
  const basePath = getAdminBasePath();
  if (!session) redirect(`${basePath}/login`);
  if (!session.role.isFounderRole) redirect(`${basePath}/dashboard`);

  await connectToDatabase();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [activeMemberships, suspendedMemberships, roleCount, auditToday, unreadNotifications, pendingEvents, failedEvents, recentActivity] = await Promise.all([
    BusinessMembership.countDocuments({ status: "active" }),
    BusinessMembership.countDocuments({ status: "suspended" }),
    BusinessRole.countDocuments({}),
    PlatformAuditEvent.countDocuments({ createdAt: { $gte: since } }),
    PlatformNotification.countDocuments({ recipientId: session.user._id, readAt: { $exists: false } }),
    PlatformEvent.countDocuments({ status: { $in: ["pending", "processing"] } }),
    PlatformEvent.countDocuments({ status: "failed" }),
    PlatformAuditEvent.find({}).sort({ createdAt: -1 }).limit(7).select("actorType actorLabel actorId action module outcome targetType targetId createdAt").lean(),
  ]);

  const config = getPlatformRuntimeConfig();
  const availableModules = PLATFORM_MODULE_REGISTRY.filter((module) => module.status === "available").length;
  const plannedModules = PLATFORM_MODULE_REGISTRY.length - availableModules;
  const databaseReady = true;

  return (
    <div className="space-y-7 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_85%_10%,rgba(46,197,240,0.18),transparent_30%),linear-gradient(125deg,#111735_0%,#17133a_52%,#101b35_100%)] p-6 shadow-2xl shadow-violet-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              Founder command environment
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Business Control Centre</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              One operational view of identity, governance, platform activity and the business systems being brought online across TGO DevStudio.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`${basePath}/users`} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">
                Manage people <ArrowUpRight size={16} />
              </Link>
              <Link href={`${basePath}/audit-log`} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Review activity <Activity size={16} />
              </Link>
            </div>
          </div>
          <div className="grid min-w-[230px] grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <p className="text-xs text-slate-400">Platform runtime</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Connected
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Database session active</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <p className="text-xs text-slate-400">Environment</p>
              <p className="mt-2 text-sm font-semibold capitalize text-white">{config.environment}</p>
              <p className="mt-1 text-[11px] text-slate-400">{config.enabled ? "Platform feature flag on" : "Core services only"}</p>
            </div>
          </div>
        </div>
      </section>

      {!config.enabled && (
        <div className="flex gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm text-amber-100">
          <CircleAlert className="mt-0.5 shrink-0 text-amber-300" size={18} />
          <div><p className="font-semibold">Business platform rollout flag is off</p><p className="mt-1 text-amber-100/70">The Founder Control Centre is available to you, but the global platform feature flag remains disabled. Existing CMS operations are unaffected.</p></div>
        </div>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan-400">Operational snapshot</p><h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">Platform at a glance</h3></div>
          <span className="text-xs text-[var(--text-muted)]">Last 24 hours · live database counts</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active memberships" value={activeMemberships} detail={`${suspendedMemberships} suspended memberships`} icon={Users} tone="cyan" />
          <MetricCard label="Business roles" value={roleCount} detail="Configured platform roles" icon={ShieldCheck} tone="violet" />
          <MetricCard label="Audit activity" value={auditToday} detail="Recorded actions in 24 hours" icon={Activity} tone="emerald" />
          <MetricCard label="Unread notifications" value={unreadNotifications} detail="For your founder account" icon={Bell} tone="amber" />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan-400">System portfolio</p><h3 className="mt-1 text-lg font-bold text-[var(--text-primary)]">Business modules</h3></div>
            <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs text-[var(--text-secondary)]">{availableModules} live · {plannedModules} planned</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLATFORM_MODULE_REGISTRY.map((module) => {
              const isLive = module.status === "available";
              const href = module.id === "identity-governance" ? `${basePath}/roles` : undefined;
              const content = (
                <div className="flex h-full gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/60 p-4 transition ${isLive ? "hover:border-brand-cyan-400/40" : "opacity-80"}">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isLive ? "bg-cyan-400/10 text-cyan-300" : "bg-violet-400/10 text-violet-300"}`}><Layers3 size={19} /></span>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-[var(--text-primary)]">{module.name}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${isLive ? "bg-emerald-400/10 text-emerald-300" : "bg-violet-400/10 text-violet-300"}`}>{isLive ? "Available" : "Roadmap"}</span></div><p className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)]">{module.description}</p>{href && <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300">Open governance <ArrowUpRight size={13} /></p>}</div>
                </div>
              );
              return href ? <Link key={module.id} href={href} className="block">{content}</Link> : <div key={module.id}>{content}</div>;
            })}
          </div>
        </div>

        <div className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300"><Gauge size={19} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan-400">Event operations</p><h3 className="text-lg font-bold text-[var(--text-primary)]">Delivery queue</h3></div></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[var(--bg-surface-2)] p-4"><div><p className="text-sm font-semibold text-[var(--text-primary)]">Pending / processing</p><p className="mt-1 text-xs text-[var(--text-muted)]">Events awaiting dispatch</p></div><span className="text-2xl font-bold text-cyan-300">{numberFormat.format(pendingEvents)}</span></div>
            <div className="flex items-center justify-between rounded-xl bg-[var(--bg-surface-2)] p-4"><div><p className="text-sm font-semibold text-[var(--text-primary)]">Failed events</p><p className="mt-1 text-xs text-[var(--text-muted)]">Require dispatcher / retry workflow</p></div><span className={`text-2xl font-bold ${failedEvents ? "text-rose-300" : "text-emerald-300"}`}>{numberFormat.format(failedEvents)}</span></div>
          </div>
          <div className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4 text-xs leading-5 text-[var(--text-secondary)]">
            <p className="font-semibold text-cyan-200">Infrastructure note</p>
            The event outbox is recording-ready. A production dispatcher and delivery adapters are a separate operational capability and are not represented as active here.
          </div>
          <Link href={`${basePath}/audit-log`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan-400 hover:underline">Inspect platform audit <ArrowUpRight size={15} /></Link>
        </div>
      </section>

      <section className="surface-card overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] p-5 sm:px-6">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan-400">Governance trail</p><h3 className="mt-1 text-lg font-bold text-[var(--text-primary)]">Recent platform activity</h3></div>
          <Link href={`${basePath}/audit-log`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-cyan-400 hover:underline">Full audit log <ArrowUpRight size={14} /></Link>
        </div>
        {recentActivity.length ? (
          <div className="divide-y divide-[var(--border-subtle)]">
            {recentActivity.map((entry, index) => (
              <div key={String(entry._id)} className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${entry.outcome === "success" ? "bg-emerald-400/10 text-emerald-300" : entry.outcome === "denied" ? "bg-amber-400/10 text-amber-300" : "bg-rose-400/10 text-rose-300"}`}><Fingerprint size={17} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[var(--text-primary)]">{entry.action}</p><p className="mt-1 truncate text-xs text-[var(--text-muted)]">{entry.actorLabel || entry.actorId} · {entry.module}{entry.targetType ? ` · ${entry.targetType}` : ""}</p></div>
                <div className="text-right"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${entry.outcome === "success" ? "bg-emerald-400/10 text-emerald-300" : entry.outcome === "denied" ? "bg-amber-400/10 text-amber-300" : "bg-rose-400/10 text-rose-300"}`}>{entry.outcome}</span><p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]"><Clock3 size={11} />{new Date(entry.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)] text-[var(--text-muted)]"><Database size={21} /></span><p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">No platform activity recorded yet</p><p className="mt-1 text-xs text-[var(--text-muted)]">New business-platform actions will appear here as they are recorded.</p></div>
        )}
      </section>
    </div>
  );
}
