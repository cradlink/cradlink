import type { AppNotification } from "@/lib/types";

export const NOTIFICATION_COPY_KEY = {
  joined: "notifications.copy.joined",
  join_request: "notifications.copy.joinRequest",
  accepted: "notifications.copy.accepted",
  declined: "notifications.copy.declined",
  edited: "notifications.copy.edited",
  comment: "notifications.copy.comment",
  reply: "notifications.copy.reply",
  follow_request: "notifications.copy.followRequest",
  followed: "notifications.copy.followed",
  kicked: "notifications.copy.kicked",
  reminder_day: "notifications.copy.reminderDay",
  reminder_hour: "notifications.copy.reminderHour",
} as const;

export function isReminder(kind: AppNotification["kind"]) {
  return kind === "reminder_day" || kind === "reminder_hour";
}

export function isFollowNotice(kind: AppNotification["kind"]) {
  return kind === "follow_request" || kind === "followed";
}
