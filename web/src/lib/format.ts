import { format, isValid, parseISO } from "date-fns";
import { LOCATION_LABELS } from "@/lib/activity-meta";
import type { Activity } from "@/lib/types";

export function formatActivityWhen(activity: Pick<Activity, "isFlexible" | "startAt" | "endAt">) {
  if (activity.isFlexible || !activity.startAt) return "Flexible dates";
  const start = parseISO(activity.startAt);
  if (!isValid(start)) return "Flexible dates";
  const startLabel = format(start, "EEE, d MMM · HH:mm");
  if (!activity.endAt) return startLabel;
  const end = parseISO(activity.endAt);
  if (!isValid(end)) return startLabel;
  if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return `${format(start, "EEE, d MMM · HH:mm")}–${format(end, "HH:mm")}`;
  }
  return `${startLabel} → ${format(end, "EEE, d MMM · HH:mm")}`;
}

export function formatLocation(activity: Pick<Activity, "location">) {
  const kind = LOCATION_LABELS[activity.location.type];
  const bits = [activity.location.city, activity.location.venue].filter(Boolean);
  if (bits.length === 0) return kind;
  if (activity.location.type === "online") return `${kind} · ${bits.join(" · ")}`;
  return `${kind} · ${bits.join(" · ")}`;
}

export function formatCapacity(memberCount: number, capacity: number | null) {
  if (capacity == null) return `${memberCount} going`;
  return `${memberCount}/${capacity}`;
}

export function isoToDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function datetimeLocalToIso(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
