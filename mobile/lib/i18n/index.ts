import { en } from "./en"
import { srCyrl } from "./sr-Cyrl"
import { srLatn } from "./sr-Latn"
import type { Locale, Messages } from "./types"

export type { Locale, Messages }

export const LOCALES: Locale[] = ["en", "sr-Latn", "sr-Cyrl"]

const DICTS: Record<Locale, Messages> = {
  en,
  "sr-Latn": srLatn,
  "sr-Cyrl": srCyrl,
}

const DATE_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  "sr-Latn": "sr-Latn",
  "sr-Cyrl": "sr-Cyrl",
}

let current: Locale = "en"
const listeners = new Set<() => void>()

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "sr-Latn" || value === "sr-Cyrl"
}

export function detectLocale(): Locale {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale ?? ""
    const lower = tag.toLowerCase()
    if (lower.startsWith("sr")) {
      if (lower.includes("cyrl") || lower.includes("cyrillic")) return "sr-Cyrl"
      return "sr-Latn"
    }
  } catch {
    /* keep English */
  }
  return "en"
}

export function getLocale() {
  return current
}

export function getMessages() {
  return DICTS[current]
}

export function getDateLocale() {
  return DATE_LOCALE[current]
}

export function setLocaleState(next: Locale) {
  if (current === next) return
  current = next
  listeners.forEach((listen) => listen())
}

export function subscribeLocale(listen: () => void) {
  listeners.add(listen)
  return () => {
    listeners.delete(listen)
  }
}

export function tx(template: string, vars?: Record<string, string | number>) {
  if (!template) return ""
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] == null ? `{${key}}` : String(vars[key]),
  )
}

export function errorMessage(err: unknown) {
  const messages = getMessages()
  const code = err instanceof Error ? err.message : "generic"
  const mapped = (messages.errors as Record<string, string>)[code]
  return mapped ?? messages.errors.generic
}
