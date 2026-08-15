import { format, isValid, parseISO } from "date-fns";
import i18n from "@/i18n";
import { getDateLocale } from "@/i18n/dates";
import { handleFromName } from "@/lib/format";
import type { Activity, User } from "@/lib/types";

export function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function haystack(...parts: Array<string | null | undefined>) {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesUser(user: User, query: string) {
  const q = normalizeQuery(query);
  if (!q) return false;
  return haystack(
    user.displayName,
    handleFromName(user.displayName),
    user.location,
    user.bio,
    user.skills.join(" "),
  ).includes(q);
}

export function matchesActivity(activity: Activity, query: string) {
  const q = normalizeQuery(query);
  if (!q) return false;
  return haystack(
    activity.title,
    activity.description,
    activity.creatorName,
    activity.type,
    activity.location.city,
    activity.location.venue,
    ...(activity.tags ?? []),
    ...activity.lookingFor,
  ).includes(q);
}

export function isActivityPast(activity: Activity) {
  if (activity.status === "completed" || activity.status === "cancelled") return true;
  const when = activity.endAt || activity.startAt;
  if (activity.isFlexible || !when) return false;
  const time = new Date(when).getTime();
  return !Number.isNaN(time) && time < Date.now();
}

export function formatJoined(iso: string) {
  const date = parseISO(iso);
  if (!isValid(date)) return null;
  return i18n.t("profile.joinedIn", { date: format(date, "LLLL yyyy", { locale: getDateLocale() }) });
}
