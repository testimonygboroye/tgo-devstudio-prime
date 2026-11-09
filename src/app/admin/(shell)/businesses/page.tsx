import { redirect } from "next/navigation";
import { Building2, BriefcaseBusiness, Handshake, Store } from "lucide-react";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import { connectToDatabase } from "@/lib/db";
import BusinessOrganization from "@/models/BusinessOrganization";
import OrganizationManager from "@/components/admin/platform/OrganizationManager";

export const dynamic = "force-dynamic";

export default async function BusinessEcosystemPage() {
  const session = await getServerSession();
  const basePath = getAdminBasePath();
  if (!session) redirect(`${basePath}/login`);
  if (!session.role.isFounderRole) redirect(`${basePath}/dashboard`);
  await connectToDatabase();
  const [total, active, clients, partners, vendors, organizations] = await Promise.all([
    BusinessOrganization.countDocuments({}),
    BusinessOrganization.countDocuments({ status: "active" }),
    BusinessOrganization.countDocuments({ type: "client" }),
    BusinessOrganization.countDocuments({ type: "partner" }),
    BusinessOrganization.countDocuments({ type: "vendor" }),
    BusinessOrganization.find({}).sort({ createdAt: -1 }).limit(100).select("name slug type status website contactEmail createdAt").lean(),
  ]);
  const serialized = organizations.map((item) => ({
    id: String(item._id), name: item.name, slug: item.slug, type: item.type, status: item.status,
    website: item.website || "", contactEmail: item.contactEmail || "",
    createdAt: item.createdAt.toISOString(),
  }));
  const metrics = [
    { label: "Organizations", value: total, icon: Building2, tone: "violet" },
    { label: "Active accounts", value: active, icon: BriefcaseBusiness, tone: "emerald" },
    { label: "Clients", value: clients, icon: Store, tone: "cyan" },
    { label: "Partners & vendors", value: partners + vendors, icon: Handshake, tone: "amber" },
  ] as const;
  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_85%_10%,rgba(46,197,240,0.18),transparent_30%),linear-gradient(125deg,#111735_0%,#17133a_52%,#101b35_100%)] p-6 shadow-2xl sm:p-8">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-cyan-200">Phase 03 · Business ecosystem</div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Organizations & business accounts</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Establish the organization directory that future client, partner, vendor, workforce and project systems will share. Every change is recorded in the platform audit trail.</p>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5">
            <div className="flex items-center justify-between"><span className="text-sm text-[var(--text-secondary)]">{label}</span><span className={`rounded-xl p-3 ${tone === "violet" ? "bg-violet-500/10 text-violet-300" : tone === "emerald" ? "bg-emerald-500/10 text-emerald-300" : tone === "cyan" ? "bg-cyan-500/10 text-cyan-300" : "bg-amber-500/10 text-amber-300"}`}><Icon size={19}/></span></div>
            <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{value.toLocaleString("en")}</p>
          </article>
        ))}
      </section>
      <OrganizationManager initialOrganizations={serialized} />
    </div>
  );
}
