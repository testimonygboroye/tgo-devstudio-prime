import { Locale } from "./config";
import { getDictionary } from "./dictionaries";

export interface TranslationOptions {
  [key: string]: string | number;
}

/**
 * Gets a translation string from the dictionary.
 * Supports nested keys (e.g., 'common.save') and interpolation (e.g., 'Hello {name}').
 */
export function createTranslator(locale: Locale) {
  const dict = getDictionary(locale);

  return (key: string, options?: TranslationOptions): string => {
    const keys = key.split(".");
    let value: any = dict;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Fallback to English if not found in current locale
        const enDict = getDictionary("en");
        let enValue: any = enDict;
        for (const enK of keys) {
          if (enValue && typeof enValue === "object" && enK in enValue) {
            enValue = enValue[enK];
          } else {
            return key; // Key not found in English either
          }
        }
        value = enValue;
        break;
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    if (options) {
      Object.entries(options).forEach(([k, v]) => {
        value = (value as string).replace(new RegExp(`{${k}}`, "g"), String(v));
      });
    }

    return value;
  };
}

/**
 * Localizes a Mongoose/plain document based on the current locale.
 */
export function getLocalizedContent<T extends object>(
  doc: T,
  locale: Locale,
  fields: readonly (keyof T)[]
): T {
  const document = doc as T & {
    translations?: Map<string, Record<string, unknown>> | Record<string, Record<string, unknown>>;
  };

  if (locale === "en" || !document.translations) {
    return doc;
  }

  let translations: Record<string, unknown> | null = null;
  if (document.translations instanceof Map) {
    translations = document.translations.get(locale) ?? null;
  } else if (typeof document.translations === "object") {
    translations = document.translations[locale] ?? null;
  }

  if (!translations) {
    return doc;
  }

  const localized = { ...doc } as T & Record<string, unknown>;
  for (const field of fields) {
    const value = translations[String(field)];
    if (value !== undefined && value !== null && value !== "") {
      localized[String(field)] = value;
    }
  }

  return localized as T;
}
