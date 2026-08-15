export function nowIso() {
  return new Date().toISOString()
}

export function memberId(activityId: string, userId: string) {
  return `${activityId}_${userId}`
}

export function followId(followerId: string, followeeId: string) {
  return `${followerId}_${followeeId}`
}

export function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

export function asTime(value: unknown, fallback = nowIso()) {
  if (typeof value === "string" && value) return value
  if (value && typeof value === "object" && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString()
    } catch {
      return fallback
    }
  }
  return fallback
}

export function firstImage(images: string[] | undefined) {
  const first = images?.find((item) => Boolean(item))
  return first ? [first] : []
}
