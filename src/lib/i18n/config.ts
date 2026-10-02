export const LOCALES = ["en", "fr", "es", "ar", "de", "yo"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const RTL_LOCALES: Locale[] = ["ar"];

export interface LanguageInfo {
  code: Locale;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
}

export const LANGUAGES: Record<Locale, LanguageInfo> = {
  en: { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  fr: { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  es: { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  ar: { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  de: { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" },
  yo: { code: "yo", name: "Yoruba", nativeName: "Yorùbá", dir: "ltr" },
};
