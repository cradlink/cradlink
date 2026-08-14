import { LOCATION_LABELS } from "@/lib/activity-meta"
import type { Activity } from "@/lib/types"

export type ScheduleBucket = "today" | "tomorrow" | "thisWeek" | "later" | "anytime" | "past"

const LABELS: Record<ScheduleBucket, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  thisWeek: "This week",
  later: "Later",
  anytime: "Anytime",
  past: "Past",
}

const ORDER: ScheduleBucket[] = ["today", "tomorrow", "thisWeek", "later", "anytime", "past"]

export function activityStart(activity: Pick<Activity, "isFlexible" | "startAt">) {
  if (activity.isFlexible || !activity.startAt) return null
  const start = new Date(activity.startAt)
  return Number.isNaN(start.getTime()) ? null : start
}

function startOfDay(value = new Date()) {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

export function scheduleBucket(activity: Pick<Activity, "isFlexible" | "startAt">, now = new Date()): ScheduleBucket {
  const start = activityStart(activity)
  if (!start) return "anytime"
  const today = startOfDay(now)
  if (start < today) return "past"
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (start < tomorrow) return "today"
  const dayAfter = new Date(today)
  dayAfter.setDate(dayAfter.getDate() + 2)
  if (start < dayAfter) return "tomorrow"
  const week = new Date(today)
  week.setDate(week.getDate() + 7)
  if (start < week) return "thisWeek"
  return "later"
}

export function sortBySchedule(a: Activity, b: Activity) {
  const left = activityStart(a)
  const right = activityStart(b)
  if (left && right) return left.getTime() - right.getTime()
  if (left) return -1
  if (right) return 1
  return b.createdAt.localeCompare(a.createdAt)
}

export function nextUp(activities: Activity[]) {
  return (
    activities
      .filter((activity) => {
        const bucket = scheduleBucket(activity)
        return bucket !== "anytime" && bucket !== "past"
      })
      .sort(sortBySchedule)[0] ?? null
  )
}

export function groupBySchedule(activities: Activity[]) {
  return ORDER.flatMap((key) => {
    const items = activities.filter((activity) => scheduleBucket(activity) === key).sort(sortBySchedule)
    return items.length > 0 ? [{ key, title: LABELS[key], items }] : []
  })
}

export function formatClock(activity: Pick<Activity, "isFlexible" | "startAt">) {
  const start = activityStart(activity)
  if (!start) return "Flexible"
  return start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

export function formatShortWhen(activity: Pick<Activity, "isFlexible" | "startAt">) {
  const start = activityStart(activity)
  if (!start) return "Flexible"
  const time = formatClock(activity)
  const bucket = scheduleBucket(activity)
  if (bucket === "today") return `Today · ${time}`
  if (bucket === "tomorrow") return `Tomorrow · ${time}`
  const day = start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
  return `${day} · ${time}`
}

export function formatDateParts(activity: Pick<Activity, "isFlexible" | "startAt">) {
  const start = activityStart(activity)
  if (!start) return null
  return {
    weekday: start.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase(),
    day: String(start.getDate()),
    month: start.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
  }
}

export function formatPlace(activity: Pick<Activity, "location">) {
  return activity.location.venue || activity.location.city || LOCATION_LABELS[activity.location.type]
}
