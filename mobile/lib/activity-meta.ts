import { getMessages } from "@/lib/i18n"
import type { ActivityType, LocationType } from "@/lib/types"

export type ActivityMeta = {
  label: string
  color: string
}

export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  hackathon: { label: "Hackathon", color: "#1d9bf0" },
  workshop: { label: "Workshop", color: "#ffd400" },
  research: { label: "Research", color: "#7856ff" },
  software: { label: "Software", color: "#00ba7c" },
  game: { label: "Game", color: "#f91880" },
  sports: { label: "Sports", color: "#00ba7c" },
  boardgames: { label: "Board games", color: "#ff7a00" },
  film: { label: "Film", color: "#f91880" },
  social: { label: "Hangout", color: "#1d9bf0" },
  other: { label: "Other", color: "#71767b" },
}

export const LOCATION_LABELS: Record<LocationType, string> = {
  online: "Online",
  "in-person": "In person",
  hybrid: "Hybrid",
}

export function activityTypeLabel(type: ActivityType) {
  return getMessages().types[type]
}

export function locationTypeLabel(type: LocationType | "all") {
  return getMessages().places[type]
}
