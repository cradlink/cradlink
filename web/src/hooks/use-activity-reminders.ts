import { useEffect } from "react";
import i18n from "@/i18n";
import { useCreatedActivities, useJoinedActivities } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { getBackend } from "@/lib/backend";
import { notify, reminderId } from "@/lib/data/notify";
import type { Activity, User } from "@/lib/types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function startOfLocalDay(ms: number) {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function showBrowserAlert(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/images/cradlink.svg" });
  } catch {
    // ignore browser notification failures
  }
}

async function sendHourEmail(user: User, activity: Activity) {
  if (user.emailReminders === false || !user.email) return;
  try {
    await fetch("/api/reminder-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: user.email,
        title: activity.title,
        startAt: activity.startAt,
        activityUrl: `${window.location.origin}/activities/${activity.id}`,
        unsubscribeUrl: `${window.location.origin}/settings/notifications?emailReminders=off`,
      }),
    });
  } catch {
    // Email is best-effort; in-app and browser alerts still go out.
  }
}

async function ensureReminders(user: User, activities: Activity[]) {
  const backend = getBackend();
  const now = Date.now();
  const today = startOfLocalDay(now);
  const seen = new Set<string>();

  for (const activity of activities) {
    if (seen.has(activity.id) || activity.isFlexible || !activity.startAt) continue;
    seen.add(activity.id);
    const start = new Date(activity.startAt).getTime();
    if (Number.isNaN(start) || start <= now) continue;
    const startDay = startOfLocalDay(start);
    const isTomorrow = startDay === today + DAY;

    if (isTomorrow && now >= start - DAY) {
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
        await sendHourEmail(user, activity);
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
