"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, CircleAlert, Globe2, Plus, Search, ShieldCheck } from "lucide-react";

type Organization = {
  id: string; name: string; slug: string; type: "internal" | "client" | "partner" | "vendor";
  status: "active" | "suspended"; website: string; contactEmail: string; createdAt: string;
};

const typeLabels: Record<Organization["type"], string> = {
  internal: "Internal", client: "Client", partner: "Partner", vendor: "Vendor",
};

export default function OrganizationManager({ initialOrganizations }: { initialOrganizations: Organization[] }) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", type: "client", contactEmail: "", website: "", notes: "" });

  const filtered = useMemo(() => organizations.filter((item) =>
    [item.name, item.slug, item.contactEmail, item.type].join(" ").toLowerCase().includes(query.toLowerCase())
  ), [organizations, query]);

  async function createOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/platform/organizations", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create organization.");
      setOrganizations((current) => [ { ...data.organization, id: data.organization._id, website: data.organization.website || "", contactEmail: data.organization.contactEmail || "" }, ...current ]);
      setForm({ name: "", type: "client", contactEmail: "", website: "", notes: "" });
      setShowForm(false); setSuccess("Organization created and recorded in the audit trail."); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create organization."); }
    finally { setBusy(false); }
  }

  async function changeStatus(item: Organization) {
    const status = item.status === "active" ? "suspended" : "active";
    setError(""); setSuccess("");
    try {
      const response = await fetch("/api/platform/organizations", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Status could not be changed.");
      setOrganizations((current) => current.map((row) => row.id === item.id ? { ...row, status } : row));
      setSuccess(`${item.name} is now ${status}.`); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Status could not be changed."); }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-brand-cyan-400">Organization directory</p><h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">Business ecosystem</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Manage the foundational records shared by future platform modules.</p></div>
        <button type="button" onClick={() => setShowForm((value) => !value)} className="btn-premium-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"><Plus size={17}/>{showForm ? "Close form" : "Add organization"}</button>
      </div>
      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"><CircleAlert size={17}/>{error}</div>}
      {success && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"><Check size={17}/>{success}</div>}
      {showForm && <form onSubmit={createOrganization} className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5 sm:p-6">
        <div className="mb-5"><h3 className="text-lg font-semibold text-[var(--text-primary)]">Create organization</h3><p className="mt-1 text-sm text-[var(--text-muted)]">A unique slug is generated from the organization name.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-[var(--text-secondary)] sm:col-span-2">Organization name *<input required maxLength={140} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium mt-2" placeholder="e.g. Acme Technologies"/></label>
          <label className="text-sm text-[var(--text-secondary)]">Organization type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="select-premium mt-2"><option value="client">Client</option><option value="internal">Internal business unit</option><option value="partner">Partner</option><option value="vendor">Vendor</option></select></label>
          <label className="text-sm text-[var(--text-secondary)]">Contact email<input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="input-premium mt-2" placeholder="contact@example.com"/></label>
          <label className="text-sm text-[var(--text-secondary)] sm:col-span-2">Website<input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input-premium mt-2" placeholder="https://example.com"/></label>
          <label className="text-sm text-[var(--text-secondary)] sm:col-span-2">Internal notes<textarea rows={3} maxLength={2000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="textarea-premium mt-2" placeholder="Optional context for the internal team."/></label>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="btn-premium-secondary rounded-xl px-4 py-2.5 text-sm">Cancel</button><button disabled={busy} className="btn-premium-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Creating…" : "Create organization"}<Plus size={16}/></button></div>
      </form>}
      <div className="surface-card overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"/><input value={query} onChange={(e) => setQuery(e.target.value)} className="input-premium pl-10" placeholder="Search organizations…"/></div><span className="text-xs text-[var(--text-muted)]">{filtered.length} of {organizations.length} organizations</span></div>
        {filtered.length === 0 ? <div className="px-6 py-14 text-center"><Building2 size={30} className="mx-auto text-[var(--text-muted)]"/><h3 className="mt-3 font-semibold text-[var(--text-primary)]">{organizations.length ? "No matching organizations" : "Your organization directory is empty"}</h3><p className="mt-1 text-sm text-[var(--text-muted)]">{organizations.length ? "Try a different search term." : "Add the first client, partner, vendor or internal business unit to begin."}</p></div> :
        <div className="divide-y divide-[var(--border-subtle)]">{filtered.map((item) => <article key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3"><span className="rounded-xl bg-violet-500/10 p-3 text-violet-300"><Building2 size={20}/></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-[var(--text-primary)]">{item.name}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${item.status === "active" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>{item.status}</span></div><p className="mt-1 text-xs text-[var(--text-muted)]">{typeLabels[item.type]} · {item.slug}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">{item.contactEmail && <span>{item.contactEmail}</span>}{item.website && <a href={item.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:underline"><Globe2 size={12}/>Website</a>}</div></div></div>
          <button type="button" onClick={() => changeStatus(item)} className="btn-premium-secondary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"><ShieldCheck size={15}/>{item.status === "active" ? "Suspend account" : "Reactivate account"}<ChevronDown size={13}/></button>
        </article>)}</div>}
      </div>
      <p className="text-xs leading-5 text-[var(--text-muted)]">Organization records are currently the platform&apos;s shared directory. User memberships, invitations, client portal access, project links and billing relationships will be connected in their dedicated roadmap phases; creating an organization does not automatically grant access to anyone.</p>
    </section>
  );
}
