"use client";

import { useTheme, ThemeMode } from "./ThemeProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { LANGUAGES, Locale } from "@/lib/i18n/config";
import { Sun, Moon, Laptop, Globe, Check } from "lucide-react";

export default function ThemeAndLanguageSettings() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useTranslation();

  const themes: { id: ThemeMode; label: string; desc: string; icon: any } = [
    { id: "light" as ThemeMode, label: t.common.light, desc: t.theme.lightDesc, icon: Sun },
    { id: "dark" as ThemeMode, label: t.common.dark, desc: t.theme.darkDesc, icon: Moon },
    { id: "system" as ThemeMode, label: t.common.system, desc: t.theme.systemDesc, icon: Laptop },
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto p-6 surface-card rounded-2xl">
      {/* Theme Section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sun size={20} className="text-[var(--color-brand-cyan-400)]" />
          <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">
            {t.theme.title}
          </h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {t.theme.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themes.map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={`relative text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-[var(--color-brand-cyan-400)] bg-[var(--bg-surface-2)] shadow-md"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Icon size={22} className={isSelected ? "text-[var(--color-brand-cyan-400)]" : "text-[var(--text-muted)]"} />
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-cyan-400)] text-[var(--color-base-950)]">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">{item.label}</h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-[var(--border-subtle)]" />

      {/* Language Section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Globe size={20} className="text-[var(--color-brand-cyan-400)]" />
          <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">
            {t.language.title}
          </h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {t.language.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.values(LANGUAGES).map((lang) => {
            const isSelected = locale === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLocale(lang.code as Locale)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? "border-[var(--color-brand-cyan-400)] bg-[var(--bg-surface-2)] shadow-md"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)]"
                }`}
              >
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{lang.nativeName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{lang.name}</p>
                </div>
                {isSelected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-cyan-400)] text-[var(--color-base-950)]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
