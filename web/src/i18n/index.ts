import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_STORAGE_KEY,
  getLocale,
  resolveLocale,
  type LocaleCode,
} from "@/i18n/catalog";

const resources = Object.fromEntries(
  LOCALES.map((locale) => [locale.code, { translation: locale.messages }]),
);

function detectLocale(): LocaleCode {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored) return resolveLocale(stored);
  } catch {
    // ignore private-mode storage
  }
  if (typeof navigator !== "undefined") return resolveLocale(navigator.language);
  return DEFAULT_LOCALE;
}

export function applyDocumentLocale(code: string) {
  if (typeof document === "undefined") return;
  const locale = getLocale(resolveLocale(code));
  document.documentElement.lang = locale.htmlLang;
  const description = document.querySelector('meta[name="description"]');
  description?.setAttribute("content", i18n.t("app.tagline"));
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: LOCALES.map((locale) => locale.code),
  nonExplicitSupportedLngs: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on("languageChanged", (lng) => {
  const code = resolveLocale(lng);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, code);
  } catch {
    // ignore private-mode storage
  }
  applyDocumentLocale(code);
});

applyDocumentLocale(i18n.language);

export { LOCALES, DEFAULT_LOCALE, LOCALE_STORAGE_KEY, getLocale, resolveLocale };
export type { LocaleCode, LocaleDefinition, Messages } from "@/i18n/catalog";
export default i18n;
