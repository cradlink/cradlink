import i18n from "@/i18n";
import type { Activity, ActivityType, LocationType } from "@/lib/types";

export type ActivityMeta = {
  label: string;
  className: string;
  stripe: string;
  dot: string;
  defaultImage: string;
};

export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  hackathon: {
    label: "Hackathon",
    className: "bg-[#1d9bf01a] text-[#1d9bf0]",
    stripe: "bg-[#1d9bf0]",
    dot: "bg-[#1d9bf0]",
    defaultImage: "/defaults/hackathon.jpg",
  },
  workshop: {
    label: "Workshop",
    className: "bg-[#ffd4001a] text-[#ffd400]",
    stripe: "bg-[#ffd400]",
    dot: "bg-[#ffd400]",
    defaultImage: "/defaults/workshop.jpg",
  },
  research: {
    label: "Research",
    className: "bg-[#7856ff1a] text-[#7856ff]",
    stripe: "bg-[#7856ff]",
    dot: "bg-[#7856ff]",
    defaultImage: "/defaults/research.jpg",
  },
  software: {
    label: "Software",
    className: "bg-[#00ba7c1a] text-[#00ba7c]",
    stripe: "bg-[#00ba7c]",
    dot: "bg-[#00ba7c]",
    defaultImage: "/defaults/software.jpg",
  },
  game: {
    label: "Game",
    className: "bg-[#f918801a] text-[#f91880]",
    stripe: "bg-[#f91880]",
    dot: "bg-[#f91880]",
    defaultImage: "/defaults/game.jpg",
  },
  sports: {
    label: "Sports",
    className: "bg-[#00ba7c1a] text-[#00ba7c]",
    stripe: "bg-[#00ba7c]",
    dot: "bg-[#00ba7c]",
    defaultImage: "/defaults/sports.jpg",
  },
  boardgames: {
    label: "Board games",
    className: "bg-[#ff7a001a] text-[#ff7a00]",
    stripe: "bg-[#ff7a00]",
    dot: "bg-[#ff7a00]",
    defaultImage: "/defaults/boardgames.jpg",
  },
  film: {
    label: "Film",
    className: "bg-[#f918801a] text-[#f91880]",
    stripe: "bg-[#f91880]",
    dot: "bg-[#f91880]",
    defaultImage: "/activities/imagine.jpg",
  },
  social: {
    label: "Hangout",
    className: "bg-[#1d9bf01a] text-[#1d9bf0]",
    stripe: "bg-[#1d9bf0]",
    dot: "bg-[#1d9bf0]",
    defaultImage: "/activities/spacex.jpg",
  },
  other: {
    label: "Other",
    className: "bg-[#71767b33] text-[#e7e9ea]",
    stripe: "bg-[#71767b]",
    dot: "bg-[#71767b]",
    defaultImage: "/defaults/other.jpg",
  },
};

export function resolveActivityImages(activity: Pick<Activity, "type" | "images">) {
  if (activity.images?.length) return activity.images;
  return [ACTIVITY_META[activity.type].defaultImage];
}

export const FEED_GRID = "flex flex-col";

export const LOCATION_LABELS: Record<LocationType, string> = {
  online: "Online",
  "in-person": "In person",
  hybrid: "Hybrid",
};

export function activityTypeLabel(type: ActivityType) {
  return i18n.t(`activity.types.${type}`);
}

export function locationLabel(type: LocationType) {
  return i18n.t(`activity.location.${type}`);
}
