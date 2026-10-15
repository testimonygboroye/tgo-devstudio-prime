import SettingsNavigation from "@/components/settings/SettingsNavigation";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator } from "@/lib/i18n/translationHelper";

export default async function PublicSettingsPage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);

  return (
    <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3 text-center">
          <span className="eyebrow-label justify-center">
            {t("common.settings")}
          </span>
          <h1 className="text-3xl font-bold font-display text-[var(--text-primary)] sm:text-4xl">
            Settings
          </h1>
          <p className="mx-auto max-w-xl text-[var(--text-secondary)]">
            Personalise your browsing experience.
          </p>
        </header>

        <SettingsNavigation basePath="/settings" />
      </div>
    </div>
  );
}
