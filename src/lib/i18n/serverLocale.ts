import { cookies, headers } from "next/headers";
import { Locale, DEFAULT_LOCALE, LOCALES } from "./config";
import { createTranslator } from "./translationHelper";

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("tgo-lang")?.value;
    if (langCookie && LOCALES.includes(langCookie as Locale)) {
      return langCookie as Locale;
    }

    const headerStore = await headers();
    const acceptLang = headerStore.get("accept-language");
    if (acceptLang) {
      const preferred = acceptLang.split(",")[0].trim().split("-")[0].toLowerCase();
      if (LOCALES.includes(preferred as Locale)) {
        return preferred as Locale;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_LOCALE;
}

export async function getTranslator() {
  const locale = await getServerLocale();
  return createTranslator(locale);
}
