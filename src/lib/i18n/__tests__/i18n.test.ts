import { LOCALES, DEFAULT_LOCALE, RTL_LOCALES, LANGUAGES } from "../config";
import { getDictionary, dictionaries } from "../dictionaries";
import { getLocalizedContent, createTranslator } from "../translationHelper";
import { formatDate, formatNumber, formatCurrency } from "../formatting";

describe("Multilingual i18n System & API Localization", () => {
  test("supported locales include en, fr, es, ar, de, yo", () => {
    expect(LOCALES).toContain("en");
    expect(LOCALES).toContain("fr");
    expect(LOCALES).toContain("es");
    expect(LOCALES).toContain("ar");
    expect(LOCALES).toContain("de");
    expect(LOCALES).toContain("yo");
    expect(DEFAULT_LOCALE).toBe("en");
    expect(RTL_LOCALES).toContain("ar");
    expect(LANGUAGES.ar.dir).toBe("rtl");
    expect(LANGUAGES.en.dir).toBe("ltr");
  });

  test("getDictionary returns dictionary for all locales with required keys including api", () => {
    for (const loc of LOCALES) {
      const dict = getDictionary(loc);
      expect(dict).toBeDefined();
      expect(dict.nav).toBeDefined();
      expect(dict.common).toBeDefined();
      expect(dict.auth).toBeDefined();
      expect(dict.admin).toBeDefined();
      expect(dict.home).toBeDefined();
      expect(dict.blog).toBeDefined();
      expect(dict.services).toBeDefined();
      expect(dict.portfolio).toBeDefined();
      expect(dict.about).toBeDefined();
      expect(dict.careers).toBeDefined();
      expect(dict.contact).toBeDefined();
      expect(dict.faq).toBeDefined();
      expect(dict.help).toBeDefined();
      expect(dict.testimonials).toBeDefined();
      expect(dict.stack).toBeDefined();
      expect(dict.process).toBeDefined();
      expect(dict.team).toBeDefined();
      expect(dict.api).toBeDefined();
      expect(dict.api.errors).toBeDefined();
      expect(dict.api.success).toBeDefined();
    }
  });

  test("dictionary key parity across all locales matches English structure", () => {
    const enKeys = Object.keys(dictionaries.en).sort();
    for (const loc of LOCALES) {
      const locKeys = Object.keys(dictionaries[loc]).sort();
      expect(locKeys).toEqual(enKeys);
    }
  });

  test("getLocalizedContent returns English when locale is 'en' or no translations", () => {
    const doc = {
      title: "English Title",
      translations: {
        fr: { title: "Titre Français" },
        es: { title: "Título en Español" }
      }
    };

    const resEn = getLocalizedContent(doc, "en", ["title"]);
    expect(resEn.title).toBe("English Title");

    const docNoTrans = { title: "Only English" };
    const resNoTrans = getLocalizedContent(docNoTrans, "fr", ["title"]);
    expect(resNoTrans.title).toBe("Only English");
  });

  test("createTranslator supports nested keys, interpolation and fallback", () => {
    const tFr = createTranslator("fr");
    expect(tFr("common.save")).toBe("Enregistrer");
    expect(tFr("nav.home")).toBe("Accueil");
    expect(tFr("api.errors.invalidCredentials")).toBeDefined();

    // Fallback test
    const tAr = createTranslator("ar");
    expect(tAr("api.errors.invalidCredentials")).toBeDefined();
  });

  test("getLocalizedContent handles Map translations", () => {
    const map = new Map();
    map.set("fr", { title: "Titre Map Français" });
    const doc = {
      title: "English Title",
      translations: map,
    };
    const res = getLocalizedContent(doc, "fr", ["title"]);
    expect(res.title).toBe("Titre Map Français");
  });

  test("formatting helpers work correctly", () => {
    const testDate = new Date("2026-09-30T12:00:00Z");
    const formattedDateEn = formatDate(testDate, "en", { year: "numeric", month: "numeric", day: "numeric" });
    expect(formattedDateEn).toBeDefined();

    const formattedNum = formatNumber(1234567, "en");
    expect(formattedNum).toBeDefined();

    const formattedCurr = formatCurrency(1500, "en", "USD");
    expect(formattedCurr).toContain("1,500");
  });
});
