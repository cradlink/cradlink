import { enUS, sr, srLatn } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";
import en from "./locales/en.json";
import srCyrl from "./locales/sr-Cyrl.json";
import srLatnMessages from "./locales/sr-Latn.json";

/**
 * Add a language:
 * 1. Copy `locales/en.json` to `locales/{code}.json` and translate it.
 * 2. Import that file here and append one object to LOCALES.
 *    `code` is the BCP 47 tag (e.g. "de", "hr", "sr-Cyrl").
 *    `dateFns` is the matching date-fns locale, or `enUS` if none exists.
 */
export type Messages = typeof en;

export type LocaleDefinition = {
  code: string;
  nativeName: string;
  englishName: string;
  htmlLang: string;
  dateFns: DateFnsLocale;
  messages: Messages;
};

export const DEFAULT_LOCALE = "en";
export const LOCALE_STORAGE_KEY = "cl_locale";

export const LOCALES: LocaleDefinition[] = [
  {
    code: "en",
    nativeName: "English",
    englishName: "English",
    htmlLang: "en",
    dateFns: enUS,
    messages: en,
  },
  {
    code: "sr-Cyrl",
    nativeName: "Српски (ћирилица)",
    englishName: "Serbian (Cyrillic)",
    htmlLang: "sr-Cyrl",
    dateFns: sr,
    messages: srCyrl as Messages,
  },
  {
    code: "sr-Latn",
    nativeName: "Srpski (latinica)",
    englishName: "Serbian (Latin)",
    htmlLang: "sr-Latn",
    dateFns: srLatn,
    messages: srLatnMessages as Messages,
  },
];

export type LocaleCode = (typeof LOCALES)[number]["code"];

export function getLocale(code: string | undefined | null): LocaleDefinition {
  return LOCALES.find((locale) => locale.code === code) ?? LOCALES[0];
}

export function resolveLocale(input?: string | null): LocaleCode {
  if (!input) return DEFAULT_LOCALE;
  if (LOCALES.some((locale) => locale.code === input)) return input;
  const lower = input.toLowerCase();
  if (lower.startsWith("sr-latn")) return "sr-Latn";
  if (lower === "sr" || lower.startsWith("sr-")) return "sr-Cyrl";
  const prefix = lower.split("-")[0];
  const match = LOCALES.find(
    (locale) => locale.code === prefix || locale.code.toLowerCase().startsWith(`${prefix}-`),
  );
  return match?.code ?? DEFAULT_LOCALE;
}
