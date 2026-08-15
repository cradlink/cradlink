import { useEffect } from "react";
import i18n from "@/i18n";
import { useCreatedActivities, useJoinedActivities } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { getBackend } from "@/lib/backend";
import { notify, reminderId } from "@/lib/data/notify";
import type { Activity, User } from "@/lib/types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function showBrowserAlert(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/images/cradlink.svg" });
  } catch {
    // ignore browser notification failures
  }
}

async function ensureReminders(user: User, activities: Activity[]) {
  const backend = getBackend();
  const now = Date.now();
  const seen = new Set<string>();

  for (const activity of activities) {
    if (seen.has(activity.id) || activity.isFlexible || !activity.startAt) continue;
    seen.add(activity.id);
    const start = new Date(activity.startAt).getTime();
    if (Number.isNaN(start) || start <= now) continue;

    if (now >= start - DAY) {
      const result = await notify(backend.notifications, {
        id: reminderId("reminder_day", activity.id, user.id),
        recipientId: user.id,
        kind: "reminder_day",
        activityId: activity.id,
        activityTitle: activity.title,
        actorId: user.id,
      });
      if (result.created) {
        showBrowserAlert(i18n.t("alerts.tomorrow"), activity.title);
      }
    }

    if (now >= start - HOUR) {
      const result = await notify(backend.notifications, {
        id: reminderId("reminder_hour", activity.id, user.id),
        recipientId: user.id,
        kind: "reminder_hour",
        activityId: activity.id,
        activityTitle: activity.title,
        actorId: user.id,
      });
      if (result.created) {
        showBrowserAlert(i18n.t("alerts.inAnHour"), activity.title);
      }
    }
  }
}

export function useActivityReminders() {
  const { user } = useAuth();
  const created = useCreatedActivities(user?.id);
  const joined = useJoinedActivities(user?.id);
  const activities = [...(created.data ?? []), ...(joined.data ?? [])];

  useEffect(() => {
    if (!user || activities.length === 0) return;
    void ensureReminders(user, activities);
    const timer = window.setInterval(() => {
      void ensureReminders(user, activities);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [user, created.data, joined.data]);
}
