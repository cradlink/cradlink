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

export function handleKey(
  user: { username?: string | null; displayName?: string | null } | string | null | undefined,
) {
  if (typeof user === "string" || user == null) return normalizeUsername(user ?? "")
  return normalizeUsername(user.username || user.displayName || "")
}

export function handleTakenBy(
  people: { id: string; username?: string | null; displayName?: string | null }[],
  handle: string,
  exceptUserId?: string,
) {
  const key = normalizeUsername(handle)
  if (!key) return false
  return people.some((person) => person.id !== exceptUserId && handleKey(person) === key)
}

export function usernameIssue(value: string): UsernameIssue | null {
  const handle = normalizeUsername(value)
  if (handle.length < 3) return "tooShort"
  if (handle.length > 20) return "tooLong"
  if (!/^[a-z0-9_]+$/.test(handle)) return "invalid"
  if (RESERVED.has(handle)) return "unavailable"
  return null
}

export function suggestUsername(seed: string, taken: Iterable<string> = []) {
  const blocked = new Set(Array.from(taken, (item) => normalizeUsername(item)).filter(Boolean))
  const base = normalizeUsername(seed).slice(0, 20)
  const start = base.length >= 3 ? base : `user${Math.random().toString(36).slice(2, 6)}`
  if (!blocked.has(start) && !RESERVED.has(start)) return start
  for (let i = 0; i < 24; i++) {
    const next = `${start.slice(0, 16)}${Math.floor(Math.random() * 90 + 10)}`
    if (!blocked.has(next) && !RESERVED.has(next)) return next
  }
  return `${start.slice(0, 14)}${Date.now().toString(36).slice(-6)}`
}
