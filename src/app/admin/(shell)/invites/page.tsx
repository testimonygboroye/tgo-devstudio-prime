import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import InvitesClient from "./InvitesClient";

export default async function InvitesPage() {
  const session = await getServerSession();
  if (!session!.role.canManageUsers) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Admin</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Invites</h1>
      <div className="mt-8">
        <InvitesClient />
      </div>
    </div>
  );
}
