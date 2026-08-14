import { LOCATION_LABELS } from "@/lib/activity-meta"
import type { Activity, Headcount, JoinPolicy } from "@/lib/types"

export function formatActivityWhen(activity: Pick<Activity, "isFlexible" | "startAt" | "endAt">) {
  if (activity.isFlexible || !activity.startAt) return "Flexible dates"
  const start = new Date(activity.startAt)
  if (Number.isNaN(start.getTime())) return "Flexible dates"
  return start.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatLocation(activity: Pick<Activity, "location">) {
  const kind = LOCATION_LABELS[activity.location.type]
  const bits = [activity.location.city, activity.location.venue].filter(Boolean)
  if (bits.length === 0) return kind
  return `${kind} · ${bits.join(" · ")}`
}

export function formatHeadcount(activity: Pick<Activity, "memberCount" | "headcount" | "capacity">) {
  const going = activity.memberCount
  const h: Headcount | undefined = activity.headcount
  if (!h || h.mode === "open") return `${going} going`
  if (h.mode === "limit" && h.max != null) return `${going}/${h.max} going`
  if (h.mode === "range") {
    if (h.min != null && h.max != null) return `${going} going · looking for ${h.min}–${h.max}`
    if (h.min != null) return `${going} going · looking for ${h.min}+`
    if (h.max != null) return `${going}/${h.max} going`
  }
  if (h.mode === "estimate" && h.about != null) return `${going} going · around ${h.about} people`
  return `${going} going`
}

export function formatJoinPolicy(policy: JoinPolicy) {
  return policy === "manual" ? "Organizer accepts" : "Instant join"
}

export function formatCardMeta(activity: Pick<Activity, "location" | "isFlexible" | "startAt" | "memberCount">) {
  const place = activity.location.city || LOCATION_LABELS[activity.location.type]
  let when = "Flexible"
  if (!activity.isFlexible && activity.startAt) {
    const start = new Date(activity.startAt)
    if (!Number.isNaN(start.getTime())) {
      when = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    }
  }
  return `${place} · ${when} · ${activity.memberCount} going`
}
