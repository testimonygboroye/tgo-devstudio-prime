import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import RolesListClient from "./RolesListClient";

export default async function RolesPage() {
  const session = await getServerSession();
  if (!session!.role.canManageRoles) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }
  const basePath = getAdminBasePath();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Admin</p>
          <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Manage Roles</h1>
        </div>
        <Link
          href={`${basePath}/roles/new`}
          className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950"
        >
          New Role
        </Link>
      </div>
      <div className="mt-8">
        <RolesListClient />
      </div>
    </div>
  );
}
