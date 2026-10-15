import ThemeAndLanguageSettings from "@/components/shared/ThemeAndLanguageSettings";

export default function PublicThemeSettingsPage() {
  return (
    <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold font-display text-[var(--text-primary)]">
            Theme Settings
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Choose light, dark, or system appearance.
          </p>
        </header>
        <ThemeAndLanguageSettings mode="theme" />
      </div>
    </div>
  );
}
