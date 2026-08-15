const RESERVED = new Set([
  "admin",
  "administrator",
  "api",
  "cradlink",
  "help",
  "login",
  "me",
  "mod",
  "moderator",
  "official",
  "profile",
  "root",
  "search",
  "settings",
  "signup",
  "support",
  "username",
  "www",
])

export type UsernameIssue = "tooShort" | "tooLong" | "invalid" | "unavailable"

export function normalizeUsername(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "")
}

export function usernameIssue(value: string): UsernameIssue | null {
  const handle = normalizeUsername(value)
  if (handle.length < 3) return "tooShort"
  if (handle.length > 20) return "tooLong"
  if (!/^[a-z0-9_]+$/.test(handle)) return "invalid"
  if (RESERVED.has(handle)) return "unavailable"
  return null
}

export function suggestUsername(seed: string) {
  const base = normalizeUsername(seed).slice(0, 20)
  return base.length >= 3 ? base : `user${Math.random().toString(36).slice(2, 6)}`
}
