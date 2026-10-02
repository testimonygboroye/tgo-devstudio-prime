"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Locale, DEFAULT_LOCALE, RTL_LOCALES } from "./config";
import { getDictionary, Dictionary } from "./dictionaries";
import { createTranslator, TranslationOptions } from "./translationHelper";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: TranslationOptions) => string;
  dict: Dictionary;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  const updateDocumentAttributes = useCallback((loc: Locale) => {
    const isRtl = RTL_LOCALES.includes(loc);
    document.documentElement.setAttribute("lang", loc);
    document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("tgo-lang") as Locale | null;
    if (stored && ["en", "fr", "es", "ar", "de", "yo"].includes(stored)) {
      setLocaleState(stored);
      updateDocumentAttributes(stored);
    }
  }, [updateDocumentAttributes]);

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    localStorage.setItem("tgo-lang", newLocale);
    document.cookie = `tgo-lang=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    updateDocumentAttributes(newLocale);
  }

  const t = useMemo(() => createTranslator(locale), [locale]);
  const dict = useMemo(() => getDictionary(locale), [locale]);
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dict, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return ctx;
}
