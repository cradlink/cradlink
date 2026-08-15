import i18n from "@/i18n";
import { resolveCoverSrc } from "@/lib/default-covers";
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
    defaultImage: "hackathon-1",
  },
  workshop: {
    label: "Workshop",
    className: "bg-[#ffd4001a] text-[#ffd400]",
    stripe: "bg-[#ffd400]",
    dot: "bg-[#ffd400]",
    defaultImage: "workshop-1",
  },
  research: {
    label: "Research",
    className: "bg-[#7856ff1a] text-[#7856ff]",
    stripe: "bg-[#7856ff]",
    dot: "bg-[#7856ff]",
    defaultImage: "research-1",
  },
  software: {
    label: "Software",
    className: "bg-[#00ba7c1a] text-[#00ba7c]",
    stripe: "bg-[#00ba7c]",
    dot: "bg-[#00ba7c]",
    defaultImage: "software-1",
  },
  game: {
    label: "Game",
    className: "bg-[#f918801a] text-[#f91880]",
    stripe: "bg-[#f91880]",
    dot: "bg-[#f91880]",
    defaultImage: "game-1",
  },
  sports: {
    label: "Sports",
    className: "bg-[#00ba7c1a] text-[#00ba7c]",
    stripe: "bg-[#00ba7c]",
    dot: "bg-[#00ba7c]",
    defaultImage: "sports-1",
  },
  boardgames: {
    label: "Board games",
    className: "bg-[#ff7a001a] text-[#ff7a00]",
    stripe: "bg-[#ff7a00]",
    dot: "bg-[#ff7a00]",
    defaultImage: "boardgames-1",
  },
  film: {
    label: "Film",
    className: "bg-[#f918801a] text-[#f91880]",
    stripe: "bg-[#f91880]",
    dot: "bg-[#f91880]",
    defaultImage: "film-1",
  },
  social: {
    label: "Hangout",
    className: "bg-[#1d9bf01a] text-[#1d9bf0]",
    stripe: "bg-[#1d9bf0]",
    dot: "bg-[#1d9bf0]",
    defaultImage: "social-1",
  },
  other: {
    label: "Other",
    className: "bg-[#71767b33] text-[#e7e9ea]",
    stripe: "bg-[#71767b]",
    dot: "bg-[#71767b]",
    defaultImage: "other-1",
  },
};

export function resolveActivityImages(activity: Pick<Activity, "type" | "images">) {
  const images = activity.images?.length
    ? activity.images
    : [ACTIVITY_META[activity.type].defaultImage];
  return images.map((src) => resolveCoverSrc(src, activity.type));
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
