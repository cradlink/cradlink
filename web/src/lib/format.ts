import { format, isValid, parseISO } from "date-fns";
import i18n from "@/i18n";
import { getDateLocale } from "@/i18n/dates";
import { locationLabel } from "@/lib/activity-meta";
import type { Activity } from "@/lib/types";

export function formatActivityWhen(activity: Pick<Activity, "isFlexible" | "startAt" | "endAt">) {
  if (activity.isFlexible || !activity.startAt) return i18n.t("time.flexible");
  const start = parseISO(activity.startAt);
  if (!isValid(start)) return i18n.t("time.flexible");
  const locale = getDateLocale();
  const startLabel = format(start, "EEE, d MMM · HH:mm", { locale });
  if (!activity.endAt) return startLabel;
  const end = parseISO(activity.endAt);
  if (!isValid(end)) return startLabel;
  if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return `${format(start, "EEE, d MMM · HH:mm", { locale })}–${format(end, "HH:mm", { locale })}`;
  }
  return `${startLabel} → ${format(end, "EEE, d MMM · HH:mm", { locale })}`;
}

export function formatLocation(activity: Pick<Activity, "location">) {
  const kind = locationLabel(activity.location.type);
  const bits = [activity.location.city, activity.location.venue].filter(Boolean);
  if (bits.length === 0) return kind;
  return `${kind} · ${bits.join(" · ")}`;
}

export function formatCapacity(memberCount: number, capacity: number | null) {
  if (capacity == null) return i18n.t("activity.headcount.open", { count: memberCount });
  return i18n.t("activity.headcount.limit", { count: memberCount, max: capacity });
}

export function isoToDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  ђ: "dj",
  е: "e",
  ж: "z",
  з: "z",
  и: "i",
  ј: "j",
  к: "k",
  л: "l",
  љ: "lj",
  м: "m",
  н: "n",
  њ: "nj",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  ћ: "c",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "c",
  џ: "dz",
  ш: "s",
  ё: "e",
  й: "i",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ґ: "g",
  ї: "i",
  є: "e",
  і: "i",
};

/** Stable X-style handle derived from a display name. Used for uniqueness. */
export function displayNameKey(name: string) {
  let mapped = "";
  for (const ch of name.trim().toLowerCase()) {
    mapped += CYRILLIC_TO_LATIN[ch] ?? ch;
  }
  return mapped
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]+/g, "")
    .slice(0, 30);
}

export function handleFromName(name: string) {
  return displayNameKey(name) || "member";
}

export function formatCompactTime(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60_000));
  if (mins < 1) return i18n.t("time.now");
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return format(new Date(then), "d MMM", { locale: getDateLocale() });
}

export function datetimeLocalToIso(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
