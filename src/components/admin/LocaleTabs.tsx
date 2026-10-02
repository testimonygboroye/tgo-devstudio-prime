"use client";

import React from "react";
import { LOCALES, LANGUAGES, Locale } from "@/lib/i18n/config";

interface LocaleTabsProps {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
  translations?: Record<string, Record<string, unknown>>;
  translatableFields: string[];
}

export default function LocaleTabs({
  currentLocale,
  onLocaleChange,
  translations = {},
  translatableFields,
}: LocaleTabsProps) {
  return (
    <div className="mb-6 rounded-xl border p-4 shadow-sm" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Content Localization Locale
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {currentLocale === "en"
              ? "Editing canonical English (base) content."
              : `Editing translation for ${LANGUAGES[currentLocale].nativeName} (${LANGUAGES[currentLocale].name}). Falls back to English if empty.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LOCALES.map((loc) => {
            const isSelected = currentLocale === loc;
            const langInfo = LANGUAGES[loc];
            let isTranslated = loc === "en" ? true : false;
            if (loc !== "en" && translations[loc]) {
              const tData = translations[loc];
              isTranslated = translatableFields.some((f) => {
                const val = tData[f];
                return val !== undefined && val !== null && String(val).trim() !== "";
              });
            }

            return (
              <button
                key={loc}
                type="button"
                onClick={() => onLocaleChange(loc)}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "shadow-sm"
                    : "hover:opacity-80"
                }`}
                style={{
                  backgroundColor: isSelected ? "var(--accent-primary)" : "var(--bg-surface)",
                  color: isSelected ? "var(--text-on-accent, #000)" : "var(--text-primary)",
                  borderColor: "var(--border-subtle)",
                  borderWidth: "1px",
                }}
              >
                <span>{langInfo.nativeName}</span>
                {loc !== "en" && (
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isTranslated ? "bg-emerald-500" : "bg-amber-400/60"
                    }`}
                    title={isTranslated ? "Translated" : "Using fallback"}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
