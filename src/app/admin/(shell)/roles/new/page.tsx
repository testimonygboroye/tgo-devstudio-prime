import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import RoleForm from "@/components/admin/RoleForm";

export default async function NewRolePage() {
  const session = await getServerSession();
  if (!session!.role.canManageRoles) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Admin</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">New Role</h1>
      <div className="mt-8">
        <RoleForm mode="create" />
      </div>
    </div>
  );
}
