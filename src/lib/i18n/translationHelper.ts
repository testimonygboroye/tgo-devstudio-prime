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
export function getLocalizedContent<T extends Record<string, any>>(
  doc: T,
  locale: Locale,
  fields: readonly (keyof T)[]
): T {
  if (locale === "en" || !doc.translations) {
    return doc;
  }

  // Handle both Map and plain object for translations
  let translations: any = null;
  if (doc.translations instanceof Map) {
    translations = doc.translations.get(locale);
  } else if (typeof doc.translations === 'object') {
    translations = doc.translations[locale];
  }

  if (!translations) {
    return doc;
  }

  const localized = { ...doc };
  for (const field of fields) {
    const val = translations[field as string];
    if (val !== undefined && val !== null && val !== "") {
      localized[field] = val;
    }
  }

  return localized;
}
