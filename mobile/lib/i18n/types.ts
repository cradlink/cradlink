import type { en } from "./en"

export type Locale = "en" | "sr-Latn" | "sr-Cyrl"

export type Messages = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: string
  }
}
