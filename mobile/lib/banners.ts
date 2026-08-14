import type { ImageSourcePropType } from "react-native"

import type { Activity, ActivityType } from "@/lib/types"

const NAMED: Record<string, ImageSourcePropType> = {
  spacex: require("../assets/activities/spacex.jpg"),
  imagine: require("../assets/activities/imagine.jpg"),
  connect: require("../assets/activities/connect.jpg"),
  seti: require("../assets/activities/seti.jpg"),
  hike: require("../assets/activities/hike.jpg"),
}

const DEFAULTS: Record<ActivityType, ImageSourcePropType> = {
  hackathon: require("../assets/defaults/hackathon.jpg"),
  workshop: require("../assets/defaults/workshop.jpg"),
  research: require("../assets/defaults/research.jpg"),
  software: require("../assets/defaults/software.jpg"),
  game: require("../assets/defaults/game.jpg"),
  sports: require("../assets/defaults/sports.jpg"),
  boardgames: require("../assets/defaults/boardgames.jpg"),
  film: require("../assets/activities/imagine.jpg"),
  social: require("../assets/activities/spacex.jpg"),
  other: require("../assets/defaults/other.jpg"),
}

export function resolveActivityBanner(activity: Pick<Activity, "type" | "images">): ImageSourcePropType {
  const key = activity.images[0]
  if (key && NAMED[key]) return NAMED[key]
  return DEFAULTS[activity.type]
}
