import i18n from "@/i18n";
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

export function statusForCapacity(
  activity: Pick<Activity, "status" | "memberCount">,
  capacity: number | null,
): Activity["status"] {
  if (activity.status === "cancelled" || activity.status === "completed") return activity.status;
  if (capacity != null && activity.memberCount >= capacity) return "full";
  return "open";
}

export function isActivityFull(activity: Activity) {
  if (activity.status === "full") return true;
  const cap = hardCap(activity);
  return cap != null && activity.memberCount >= cap;
}

export function formatHeadcount(activity: Activity) {
  const going = activity.memberCount;
  const h = activity.headcount;
  if (!h || h.mode === "open") return i18n.t("activity.headcount.open", { count: going });
  if (h.mode === "limit" && h.max != null) return i18n.t("activity.headcount.limit", { count: going, max: h.max });
  if (h.mode === "range") {
    const min = h.min;
    const max = h.max;
    if (min != null && max != null) {
      return i18n.t("activity.headcount.range", { count: going, min, max });
    }
    if (min != null) return i18n.t("activity.headcount.rangeMin", { count: going, min });
    if (max != null) return i18n.t("activity.headcount.limit", { count: going, max });
  }
  if (h.mode === "estimate" && h.about != null) {
    return i18n.t("activity.headcount.estimate", { count: going, about: h.about });
  }
  return i18n.t("activity.headcount.open", { count: going });
}

export function formatJoinPolicy(policy: JoinPolicy) {
  return policy === "manual" ? i18n.t("activity.joinPolicyManual") : i18n.t("activity.joinPolicyInstant");
}
