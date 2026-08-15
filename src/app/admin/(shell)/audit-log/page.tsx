import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import AuditLogClient from "./AuditLogClient";

export default async function AuditLogPage() {
  const session = await getServerSession();
  if (!session!.role.isFounderRole) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Admin</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Audit Log</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Every admin action, automatically recorded. Visible only to the Founder.
      </p>
      <div className="mt-8">
        <AuditLogClient />
      </div>
    </div>
  );
}
