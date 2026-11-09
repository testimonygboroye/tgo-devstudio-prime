"use client";

import { useMemo, useState } from "react";
import { KeyRound, Plus, Save, Search, ShieldCheck, Trash2, X, LockKeyhole, CircleAlert } from "lucide-react";

type Grant = { permission: string; scope: "global" | "self" | "department" | "team" | "project" | "client"; resourceIds: string[] };
type Role = { id: string; name: string; slug: string; description?: string; permissionGrants: Grant[]; deniedPermissions: string[]; isSystemRole: boolean };
type Props = { initialRoles: Role[]; permissionCatalogue: Record<string, string> };

export default function BusinessRoleManager({ initialRoles, permissionCatalogue }: Props) {
  const [roles, setRoles] = useState(initialRoles);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [grants, setGrants] = useState<Record<string, Grant["scope"]>>({});
  const [deniedPermissions, setDeniedPermissions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filtered = useMemo(() => roles.filter((role) => [role.name, role.slug, role.description || ""].join(" ").toLowerCase().includes(query.toLowerCase())), [roles, query]);
  const selected = roles.find((role) => role.id === selectedId) || null;
  const groups = useMemo(() => Object.entries(permissionCatalogue).reduce<Record<string, [string, string][]>>((acc, [key, label]) => {
    const group = key.split(".")[0]; (acc[group] ||= []).push([key, label]); return acc;
  }, {}), [permissionCatalogue]);

  function reset() { setSelectedId(null); setName(""); setDescription(""); setGrants({}); setDeniedPermissions([]); setError(""); setSuccess(""); }
  function edit(role: Role) {
    setSelectedId(role.id); setName(role.name); setDescription(role.description || "");
    setGrants(Object.fromEntries(role.permissionGrants.map((grant) => [grant.permission, grant.scope]))); setDeniedPermissions(role.deniedPermissions || []);
    setError(""); setSuccess("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    const permissionGrants = Object.entries(grants).map(([permission, scope]) => ({ permission, scope, resourceIds: [] }));
    try {
      const response = await fetch("/api/platform/roles", {
        method: selectedId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, name, description, permissionGrants, deniedPermissions }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Business role could not be saved.");
      setRoles((current) => selectedId ? current.map((role) => role.id === selectedId ? data.role : role) : [...current, data.role].sort((a, b) => a.name.localeCompare(b.name)));
      setSuccess(selectedId ? "Business role updated and audited." : "Business role created and audited.");
      setSelectedId(data.role.id); setName(data.role.name); setDescription(data.role.description || "");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Business role could not be saved."); }
    finally { setBusy(false); }
  }

  async function remove(role: Role) {
    if (!window.confirm(`Delete the business role “${role.name}”? This is only allowed when no member is assigned to it.`)) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/platform/roles?id=${encodeURIComponent(role.id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Business role could not be deleted.");
      setRoles((current) => current.filter((item) => item.id !== role.id));
      if (selectedId === role.id) reset();
      setSuccess("Business role deleted and the action was audited.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Business role could not be deleted."); }
    finally { setBusy(false); }
  }

  return <div className="grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
    <section className="surface-card overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
      <div className="border-b border-[var(--border-subtle)] p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-brand-cyan-400">Access governance</p><h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">Business roles</h2></div><button type="button" onClick={reset} className="btn-premium-primary inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white"><Plus size={15}/> New role</button></div><div className="relative mt-4"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles…" className="input-premium pl-9"/></div></div>
      <div className="divide-y divide-[var(--border-subtle)]">{filtered.map((role) => <div key={role.id} className={`flex items-center gap-3 p-4 ${selectedId === role.id ? "bg-violet-500/[.07]" : ""}`}><span className="rounded-xl bg-violet-500/10 p-2.5 text-violet-300"><ShieldCheck size={18}/></span><button type="button" disabled={role.isSystemRole} onClick={() => edit(role)} title={role.isSystemRole ? "System roles are protected." : "Edit role"} className="min-w-0 flex-1 text-left disabled:cursor-not-allowed"><span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{role.name}</span><span className="mt-0.5 block text-xs text-[var(--text-muted)]">{role.permissionGrants.length} grants · {role.slug}</span></button>{role.isSystemRole ? <LockKeyhole size={15} className="text-amber-300"/> : <button type="button" disabled={busy} onClick={() => void remove(role)} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40" aria-label={`Delete ${role.name}`}><Trash2 size={15}/></button>}</div>)}
      {filtered.length === 0 && <div className="p-8 text-center text-sm text-[var(--text-muted)]">No business roles found. Create a role to define platform access.</div>}</div>
      <div className="border-t border-[var(--border-subtle)] p-4 text-xs leading-5 text-[var(--text-muted)]">These business roles are separate from the legacy website CMS roles. System roles are protected, and roles assigned to members cannot be deleted.</div>
    </section>

    <form onSubmit={save} className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-brand-cyan-400">{selected ? "Edit access profile" : "Role builder"}</p><h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">{selected ? selected.name : "Create business role"}</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Assign only the permissions required for the responsibilities.</p></div>{selected && <button type="button" onClick={reset} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]" aria-label="Close editor"><X size={17}/></button>}</div>
      {error && <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300"><CircleAlert size={16}/>{error}</p>}
      {success && <p role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">{success}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm text-[var(--text-secondary)] sm:col-span-2">Role name *<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="input-premium mt-2" placeholder="e.g. Project Manager"/></label><label className="text-sm text-[var(--text-secondary)] sm:col-span-2">Description<textarea maxLength={500} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} className="textarea-premium mt-2" placeholder="Describe the responsibilities and access boundary."/></label></div>
      <div className="mt-6"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold text-[var(--text-primary)]">Permission catalogue</h3><span className="text-xs text-[var(--text-muted)]">{Object.keys(grants).length} selected</span></div><div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">{Object.entries(groups).map(([group, entries]) => <fieldset key={group} className="rounded-xl border border-[var(--border-subtle)] p-3"><legend className="px-2 text-xs font-bold uppercase tracking-[.14em] text-cyan-300">{group}</legend><div className="space-y-2">{entries.map(([permission, label]) => <div key={permission} className="flex flex-col gap-2 rounded-lg px-2 py-2 hover:bg-[var(--surface-hover)] sm:flex-row sm:items-center"><label className="flex min-w-0 flex-1 items-start gap-2.5 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={Boolean(grants[permission])} onChange={(event) => setGrants((current) => { const next = { ...current }; if (event.target.checked) next[permission] = "global"; else delete next[permission]; return next; })} className="mt-1 accent-violet-500"/><span><span className="block font-medium text-[var(--text-primary)]">{label}</span><code className="mt-0.5 block break-all text-[10px] text-[var(--text-muted)]">{permission}</code></span></label>{grants[permission] && <select value={grants[permission]} onChange={(event) => setGrants((current) => ({ ...current, [permission]: event.target.value as Grant["scope"] }))} className="select-premium w-full sm:w-36"><option value="global">Global</option><option value="self">Own records</option><option value="department">Department</option><option value="team">Team</option></select>}</div>)}</div></fieldset>)}</div></div>
      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[var(--border-subtle)] pt-4"><button type="button" onClick={reset} className="btn-premium-secondary rounded-xl px-4 py-2.5 text-sm">Clear</button><button type="submit" disabled={busy || name.trim().length < 2} className="btn-premium-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16}/>{busy ? "Saving…" : selected ? "Save changes" : "Create role"}</button></div>
      <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[var(--text-muted)]"><KeyRound size={13} className="mt-0.5 shrink-0"/>Explicit denies remain available through the API and take precedence over grants. Project/client resource-specific scopes are managed by the relevant module when those resource domains are active.</p>
    </form>
  </div>;
}
