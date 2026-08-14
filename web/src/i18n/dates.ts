import i18n, { getLocale, resolveLocale } from "@/i18n";

export function getDateLocale() {
  return getLocale(resolveLocale(i18n.language)).dateFns;
}
