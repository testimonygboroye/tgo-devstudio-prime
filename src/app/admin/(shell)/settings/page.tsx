import ThemeAndLanguageSettings from "@/components/shared/ThemeAndLanguageSettings";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-[var(--text-primary)]">
          Admin Theme & Language Settings
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Customize the appearance and preferred language for the administrative dashboard.
        </p>
      </div>

      <ThemeAndLanguageSettings />
    </div>
  );
}
