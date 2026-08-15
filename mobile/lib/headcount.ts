import type { Activity, Headcount } from "@/lib/types"

export function defaultHeadcount(capacity: number | null): Headcount {
  if (capacity == null) return { mode: "open" }
  return { mode: "limit", max: capacity }
}

export function hardCap(activity: Pick<Activity, "capacity" | "headcount">): number | null {
  const mode = activity.headcount?.mode
  if (mode === "limit" || mode === "range") {
    return activity.headcount?.max ?? activity.capacity ?? null
  }
  return activity.capacity
}

export function isActivityFull(activity: Activity) {
  if (activity.status === "full") return true
  const cap = hardCap(activity)
  return cap != null && activity.memberCount >= cap
}
