import ThemeAndLanguageSettings from "@/components/shared/ThemeAndLanguageSettings";

export default function AdminThemeSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold brand-gradient-text">
          Theme Settings
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Choose how the admin interface looks on your device.
        </p>
      </header>
      <ThemeAndLanguageSettings mode="theme" />
    </div>
  );
}
