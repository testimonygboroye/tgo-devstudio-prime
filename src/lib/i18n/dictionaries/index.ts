import { en } from "./en";
import { fr } from "./fr";
import { es } from "./es";
import { ar } from "./ar";
import { de } from "./de";
import { yo } from "./yo";
import { Locale } from "../config";

export const dictionaries = {
  en,
  fr,
  es,
  ar,
  de,
  yo,
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale] || dictionaries.en;
}

export type Dictionary = typeof en;
