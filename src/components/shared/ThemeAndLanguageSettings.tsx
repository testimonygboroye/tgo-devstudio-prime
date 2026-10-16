"use client";

import { useTheme, ThemeMode } from "./ThemeProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { LANGUAGES, Locale } from "@/lib/i18n/config";
import { Sun, Moon, Laptop, Globe, Check } from "lucide-react";

type SettingsMode = "all" | "theme" | "language";

export default function ThemeAndLanguageSettings({
  mode = "all",
}: {
  mode?: SettingsMode;
}) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useTranslation();

  const themes: {
    id: ThemeMode;
    label: string;
    desc: string;
    icon: typeof Sun;
  }[] = [
    { id: "light", label: t("common.light"), desc: t("theme.lightDesc"), icon: Sun },
    { id: "dark", label: t("common.dark"), desc: t("theme.darkDesc"), icon: Moon },
    { id: "system", label: t("common.system"), desc: t("theme.systemDesc"), icon: Laptop },
  ];

  const selectedClass =
    "border-[var(--color-brand-cyan-400)] bg-[var(--bg-surface-2)] shadow-md";
  const defaultClass =
    "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)]";

  return (
    <div className="mx-auto max-w-2xl space-y-8 rounded-2xl surface-card p-6">
      {mode !== "language" && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Sun size={20} className="text-[var(--color-brand-cyan-400)]" />
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              {t("theme.title")}
            </h2>
          </div>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            {t("theme.description")}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {themes.map((item) => {
              const Icon = item.icon;
              const selected = theme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTheme(item.id)}
                  className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                    selected ? selectedClass : defaultClass
                  }`}
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <Icon
                        size={22}
                        className={
                          selected
                            ? "text-[var(--color-brand-cyan-400)]"
                            : "text-[var(--text-muted)]"
                        }
                      />
                      {selected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-cyan-400)] text-[var(--color-base-950)]">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <h3 className="mb-1 font-semibold text-[var(--text-primary)]">
                      {item.label}
                    </h3>
                    <p className="line-clamp-2 text-xs text-[var(--text-secondary)]">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {mode === "all" && (
        <hr className="border-[var(--border-subtle)]" />
      )}

      {mode !== "theme" && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Globe size={20} className="text-[var(--color-brand-cyan-400)]" />
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              {t("language.title")}
            </h2>
          </div>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            {t("language.description")}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.values(LANGUAGES).map((lang) => {
              const selected = locale === lang.code;

              return (
                <button
                  key={lang.code}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLocale(lang.code as Locale)}
                  className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                    selected ? selectedClass : defaultClass
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {lang.name}
                    </p>
                  </div>
                  {selected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-cyan-400)] text-[var(--color-base-950)]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
