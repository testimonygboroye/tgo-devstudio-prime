import ThemeAndLanguageSettings from "@/components/shared/ThemeAndLanguageSettings";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator } from "@/lib/i18n/translationHelper";

export default async function PublicSettingsPage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="eyebrow-label justify-center">{t("common.settings")}</span>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-[var(--text-primary)]">
            {t("theme.title")}
          </h1>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            {t("theme.description")}
          </p>
        </div>

        <ThemeAndLanguageSettings />
      </div>
    </div>
  );
}
