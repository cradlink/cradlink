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

export function resolveBannerKey(key: string | undefined): ImageSourcePropType | null {
  if (!key) return null
  if (key.startsWith("file:") || key.startsWith("content:") || key.startsWith("http") || key.startsWith("data:")) {
    return { uri: key }
  }
  return NAMED[key] ?? null
}

export function resolveActivityBanner(activity: Pick<Activity, "type" | "images">): ImageSourcePropType {
  const key = activity.images[0]
  return resolveBannerKey(key) ?? DEFAULTS[activity.type]
}
