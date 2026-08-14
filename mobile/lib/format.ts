import { getDateLocale, getMessages, tx } from "@/lib/i18n"
import type { Activity, Headcount, JoinPolicy } from "@/lib/types"

export function formatActivityWhen(activity: Pick<Activity, "isFlexible" | "startAt" | "endAt">) {
  const m = getMessages()
  if (activity.isFlexible || !activity.startAt) return m.schedule.flexibleDates
  const start = new Date(activity.startAt)
  if (Number.isNaN(start.getTime())) return m.schedule.flexibleDates
  return start.toLocaleString(getDateLocale(), {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatLocation(activity: Pick<Activity, "location">) {
  const kind = getMessages().places[activity.location.type]
  const bits = [activity.location.city, activity.location.venue].filter(Boolean)
  if (bits.length === 0) return kind
  return `${kind} · ${bits.join(" · ")}`
}

export function formatHeadcount(activity: Pick<Activity, "memberCount" | "headcount" | "capacity">) {
  const m = getMessages()
  const going = activity.memberCount
  const h: Headcount | undefined = activity.headcount
  if (!h || h.mode === "open") return tx(m.format.going, { count: going })
  if (h.mode === "limit" && h.max != null) return tx(m.format.goingOf, { count: going, max: h.max })
  if (h.mode === "range") {
    if (h.min != null && h.max != null) return tx(m.format.lookingRange, { count: going, min: h.min, max: h.max })
    if (h.min != null) return tx(m.format.lookingMin, { count: going, min: h.min })
    if (h.max != null) return tx(m.format.goingOf, { count: going, max: h.max })
  }
  if (h.mode === "estimate" && h.about != null) return tx(m.format.around, { count: going, about: h.about })
  return tx(m.format.going, { count: going })
}

export function formatJoinPolicy(policy: JoinPolicy) {
  const m = getMessages()
  return policy === "manual" ? m.format.organizerAccepts : m.format.instantJoin
}

export function formatRelative(iso: string) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const minutes = Math.round((Date.now() - then) / 60000)
  if (minutes < 1) return getMessages().common.now
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString(getDateLocale(), { day: "numeric", month: "short" })
}

export function formatCardMeta(activity: Pick<Activity, "location" | "isFlexible" | "startAt" | "memberCount">) {
  const m = getMessages()
  const place = activity.location.city || m.places[activity.location.type]
  let when = m.schedule.flexible
  if (!activity.isFlexible && activity.startAt) {
    const start = new Date(activity.startAt)
    if (!Number.isNaN(start.getTime())) {
      when = start.toLocaleDateString(getDateLocale(), { day: "numeric", month: "short" })
    }
  }
  return `${place} · ${when} · ${tx(m.format.going, { count: activity.memberCount })}`
}
