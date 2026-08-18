import type { ImageSourcePropType } from "react-native"

import type { Activity, ActivityType } from "@/lib/types"

const NAMED: Record<string, ImageSourcePropType> = {
  spacex: require("../assets/activities/spacex.jpg"),
  imagine: require("../assets/activities/imagine.jpg"),
  connect: require("../assets/activities/connect.jpg"),
  seti: require("../assets/activities/seti.jpg"),
  hike: require("../assets/activities/hike.jpg"),
  "hackathon-1": require("../assets/defaults/hackathon.jpg"),
  "hackathon-2": require("../assets/banners/hackathon-2.jpg"),
  "hackathon-3": require("../assets/banners/hackathon-3.jpg"),
  "workshop-1": require("../assets/defaults/workshop.jpg"),
  "workshop-2": require("../assets/banners/workshop-2.jpg"),
  "workshop-3": require("../assets/banners/workshop-3.jpg"),
  "research-1": require("../assets/defaults/research.jpg"),
  "research-2": require("../assets/banners/research-2.jpg"),
  "research-3": require("../assets/banners/research-3.jpg"),
  "software-1": require("../assets/defaults/software.jpg"),
  "software-2": require("../assets/banners/software-2.jpg"),
  "software-3": require("../assets/banners/software-3.jpg"),
  "game-1": require("../assets/defaults/game.jpg"),
  "game-2": require("../assets/banners/game-2.jpg"),
  "game-3": require("../assets/banners/game-3.jpg"),
  "sports-1": require("../assets/defaults/sports.jpg"),
  "sports-2": require("../assets/banners/sports-2.jpg"),
  "sports-3": require("../assets/banners/sports-3.jpg"),
  "boardgames-1": require("../assets/defaults/boardgames.jpg"),
  "boardgames-2": require("../assets/banners/boardgames-2.jpg"),
  "boardgames-3": require("../assets/banners/boardgames-3.jpg"),
  "film-1": require("../assets/activities/imagine.jpg"),
  "film-2": require("../assets/banners/film-2.jpg"),
  "film-3": require("../assets/banners/film-3.jpg"),
  "social-1": require("../assets/activities/spacex.jpg"),
  "social-2": require("../assets/banners/social-2.jpg"),
  "social-3": require("../assets/banners/social-3.jpg"),
  "other-1": require("../assets/defaults/other.jpg"),
  "other-2": require("../assets/banners/other-2.jpg"),
  "other-3": require("../assets/banners/other-3.jpg"),
}

const STORAGE_BUCKET = "cradlink.firebasestorage.app"
const SHARED_DEFAULTS_PREFIX = "default-activities"
const LEGACY_DEFAULTS_PREFIX = "activities/Z97HyhHyaognvPqhnWpFS2o5F083/defaults"

function storageObjectUrl(path: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(path)}?alt=media`
}

export function storageDefaultSrc(key: string) {
  return storageObjectUrl(`${SHARED_DEFAULTS_PREFIX}/${key}.jpg`)
}

export function legacyStorageDefaultSrc(key: string) {
  return storageObjectUrl(`${LEGACY_DEFAULTS_PREFIX}/${key}.jpg`)
}

const DEFAULTS: Record<ActivityType, ImageSourcePropType> = {
  hackathon: NAMED["hackathon-1"],
  workshop: NAMED["workshop-1"],
  research: NAMED["research-1"],
  software: NAMED["software-1"],
  game: NAMED["game-1"],
  sports: NAMED["sports-1"],
  boardgames: NAMED["boardgames-1"],
  film: NAMED["film-1"],
  social: NAMED["social-1"],
  other: NAMED["other-1"],
}

export function presetsForType(type: ActivityType): string[] {
  return [`${type}-1`, `${type}-2`, `${type}-3`]
}

function keyFromStored(value: string) {
  if (NAMED[value]) return value
  try {
    const path = value.startsWith("http") ? new URL(value).pathname : value
    const match = decodeURIComponent(path).match(/([^/?#]+)$/i)
    const candidate = match?.[1]?.replace(/\.jpg$/i, "")
    if (candidate && NAMED[candidate]) return candidate
  } catch {
    /* ignore */
  }
  return null
}

export function resolveBannerKey(key: string | undefined): ImageSourcePropType | null {
  if (!key) return null
  const named = keyFromStored(key)
  if (named) return NAMED[named]
  if (key.startsWith("file:") || key.startsWith("content:") || key.startsWith("http") || key.startsWith("data:")) {
    return { uri: key }
  }
  return null
}

export function localActivityBanner(activity: Pick<Activity, "type" | "images">): ImageSourcePropType {
  return resolveBannerKey(activity.images[0]) ?? DEFAULTS[activity.type]
}

export function activityBannerSources(activity: Pick<Activity, "type" | "images">): ImageSourcePropType[] {
  const stored = activity.images[0]
  const named = stored ? keyFromStored(stored) : `${activity.type}-1`
  if (named) {
    return [
      { uri: storageDefaultSrc(named) },
      { uri: legacyStorageDefaultSrc(named) },
      NAMED[named] ?? DEFAULTS[activity.type],
    ]
  }
  if (stored && (stored.startsWith("http") || stored.startsWith("data:"))) return [{ uri: stored }]
  return [localActivityBanner(activity)]
}

export function resolveStoredImage(src: string | undefined, type: ActivityType): ImageSourcePropType {
  if (!src) return DEFAULTS[type]
  const named = keyFromStored(src)
  if (named) return NAMED[named] ?? DEFAULTS[type]
  if (src.startsWith("file:") || src.startsWith("content:") || src.startsWith("http") || src.startsWith("data:")) {
    return { uri: src }
  }
  return DEFAULTS[type]
}

export function activityImages(activity: Pick<Activity, "type" | "images">): ImageSourcePropType[] {
  const keys = activity.images?.filter(Boolean) ?? []
  if (!keys.length) return [DEFAULTS[activity.type]]
  return keys.map((src) => resolveStoredImage(src, activity.type))
}

export function resolveActivityBanner(activity: Pick<Activity, "type" | "images">): ImageSourcePropType {
  return activityImages(activity)[0]
}
