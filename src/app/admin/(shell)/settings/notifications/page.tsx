import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import PushNotificationSetup from "@/components/admin/PushNotificationSetup";

export default async function AdminNotificationSettingsPage() {
  const basePath = getAdminBasePath();
  const session = await getServerSession();

  if (!session) {
    redirect(`${basePath}/login`);
  }

  if (!session.role.isFounderRole) {
    redirect(`${basePath}/settings`);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Founder
        </p>
        <h1 className="mt-1 text-3xl font-bold brand-gradient-text">
          Notification Settings
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Configure push notifications for supported devices.
        </p>
      </header>

      <div className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5 sm:p-6">
        <PushNotificationSetup />
      </div>
    </div>
  );
}
