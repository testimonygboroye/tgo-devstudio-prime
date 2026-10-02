import ThemeAndLanguageSettings from "@/components/shared/ThemeAndLanguageSettings";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator } from "@/lib/i18n/translationHelper";

export default async function AdminSettingsPage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-[var(--text-primary)]">
          {t("common.settings")}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {t("theme.description")}
        </p>
      </div>

      <ThemeAndLanguageSettings />
    </div>
  );
}
