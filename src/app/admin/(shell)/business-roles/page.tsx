import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck, Users, LockKeyhole } from "lucide-react";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import { connectToDatabase } from "@/lib/db";
import BusinessRole from "@/models/BusinessRole";
import { PLATFORM_PERMISSION_CATALOG } from "@/platform/permissions/catalog";
import BusinessRoleManager from "@/components/admin/platform/BusinessRoleManager";

export const dynamic = "force-dynamic";

export default async function BusinessRolesPage() {
  const session = await getServerSession();
  const basePath = getAdminBasePath();
  if (!session) redirect(`${basePath}/login`);
  if (!session.role?.isFounderRole) redirect(`${basePath}/dashboard`);
  await connectToDatabase();
  const roles = await BusinessRole.find({}).sort({ name: 1 }).lean();
  const initialRoles = roles.map((role) => ({
    id: String(role._id), name: role.name, slug: role.slug, description: role.description || "",
    permissionGrants: (role.permissionGrants || []).map((grant) => ({
      permission: grant.permission, scope: grant.scope, resourceIds: grant.resourceIds || [],
    })),
    deniedPermissions: role.deniedPermissions || [], isSystemRole: role.isSystemRole,
  }));
  const permissionCount = Object.keys(PLATFORM_PERMISSION_CATALOG).length;
  return <div className="mx-auto max-w-7xl space-y-7 pb-12">
    <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_85%_10%,rgba(46,197,240,0.18),transparent_30%),linear-gradient(125deg,#111735_0%,#17133a_52%,#101b35_100%)] p-6 shadow-2xl sm:p-8">
      <div className="relative max-w-3xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-cyan-200"><ShieldCheck size={13}/> Governance · Access control</div>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Business roles & permissions</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Define reusable business access profiles against the central permission catalogue. These roles are separate from the legacy website CMS roles.</p></div>
    </section>
    <section className="grid gap-4 sm:grid-cols-3">
      <article className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5"><div className="flex items-center justify-between"><span className="text-sm text-[var(--text-secondary)]">Business roles</span><Users size={19} className="text-cyan-300"/></div><p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{initialRoles.length.toLocaleString("en")}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Defined access profiles</p></article>
      <article className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5"><div className="flex items-center justify-between"><span className="text-sm text-[var(--text-secondary)]">Permission catalogue</span><KeyRound size={19} className="text-violet-300"/></div><p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{permissionCount}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Canonical permission identifiers</p></article>
      <article className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5"><div className="flex items-center justify-between"><span className="text-sm text-[var(--text-secondary)]">Protected roles</span><LockKeyhole size={19} className="text-amber-300"/></div><p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{initialRoles.filter((role) => role.isSystemRole).length}</p><p className="mt-1 text-xs text-[var(--text-muted)]">System-defined access profiles</p></article>
    </section>
    <BusinessRoleManager initialRoles={initialRoles} permissionCatalogue={PLATFORM_PERMISSION_CATALOG}/>
  </div>;
}
