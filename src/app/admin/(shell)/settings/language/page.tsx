import ThemeAndLanguageSettings from "@/components/shared/ThemeAndLanguageSettings";

export default function AdminLanguageSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold brand-gradient-text">
          Language Settings
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Choose your preferred language.
        </p>
      </header>
      <ThemeAndLanguageSettings mode="language" />
    </div>
  );
}
