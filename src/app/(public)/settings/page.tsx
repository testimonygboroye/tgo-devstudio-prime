import ThemeAndLanguageSettings from "@/components/shared/ThemeAndLanguageSettings";

export default function PublicSettingsPage() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="eyebrow-label justify-center">Preferences</span>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-[var(--text-primary)]">
            Theme & Language Settings
          </h1>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Personalize your TGO DevStudio experience with light/dark/system themes and your preferred language.
          </p>
        </div>

        <ThemeAndLanguageSettings />
      </div>
    </div>
  );
}
