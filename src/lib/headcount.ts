import type { Activity, Headcount, JoinPolicy } from "@/lib/types";

export function defaultHeadcount(capacity: number | null): Headcount {
  if (capacity == null) return { mode: "open" };
  return { mode: "limit", max: capacity };
}

export function normalizeActivityFields(activity: Activity): Activity {
  return {
    ...activity,
    joinPolicy: activity.joinPolicy ?? "auto",
    headcount: activity.headcount ?? defaultHeadcount(activity.capacity),
  };
}

export function hardCap(activity: Pick<Activity, "capacity" | "headcount">): number | null {
  const mode = activity.headcount?.mode;
  if (mode === "limit" || mode === "range") {
    return activity.headcount?.max ?? activity.capacity ?? null;
  }
  return activity.capacity;
}

export function isActivityFull(activity: Activity) {
  if (activity.status === "full") return true;
  const cap = hardCap(activity);
  return cap != null && activity.memberCount >= cap;
}

export function formatHeadcount(activity: Activity) {
  const going = activity.memberCount;
  const h = activity.headcount;
  if (!h || h.mode === "open") return `${going} going`;
  if (h.mode === "limit" && h.max != null) return `${going}/${h.max} going`;
  if (h.mode === "range") {
    const min = h.min;
    const max = h.max;
    if (min != null && max != null) return `${going} going · looking for ${min}–${max}`;
    if (min != null) return `${going} going · looking for ${min}+`;
    if (max != null) return `${going}/${max} going`;
  }
  if (h.mode === "estimate" && h.about != null) return `${going} going · around ${h.about} people`;
  return `${going} going`;
}

export function formatJoinPolicy(policy: JoinPolicy) {
  return policy === "manual" ? "Organizer accepts" : "Instant join";
}
