import SettingsNavigation from "@/components/settings/SettingsNavigation";
import { getAdminBasePath } from "@/lib/adminPath";

export default function AdminSettingsPage() {
  const basePath = getAdminBasePath();
  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Administration
        </p>
        <h1 className="mt-1 text-3xl font-bold brand-gradient-text">
          Admin Settings
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Manage your admin preferences and notification settings.
        </p>
      </header>

      <SettingsNavigation
        basePath={`${basePath}/settings`}
        includeNotifications
      />
    </div>
  );
}
