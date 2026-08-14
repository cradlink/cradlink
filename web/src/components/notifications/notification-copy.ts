import type { AppNotification } from "@/lib/types";

export function notificationCopy(item: AppNotification) {
  const name = item.actorName || "Someone";
  switch (item.kind) {
    case "joined":
      return { lead: name, rest: ` joined ${item.activityTitle}` };
    case "join_request":
      return { lead: name, rest: ` requested to join ${item.activityTitle}` };
    case "accepted":
      return { lead: "You’re in", rest: ` ${item.activityTitle}` };
    case "declined":
      return { lead: "Request declined", rest: ` for ${item.activityTitle}` };
    case "edited":
      return { lead: name, rest: ` updated ${item.activityTitle}` };
    case "comment":
      return { lead: name, rest: ` commented on ${item.activityTitle}` };
    case "reply":
      return { lead: name, rest: ` replied to you on ${item.activityTitle}` };
    case "follow_request":
      return { lead: name, rest: " requested to follow you." };
    case "followed":
      return { lead: name, rest: " started following you." };
    case "kicked":
      return { lead: "Removed", rest: ` from ${item.activityTitle}` };
    case "reminder_day":
      return { lead: "Tomorrow", rest: ` · ${item.activityTitle}` };
    case "reminder_hour":
      return { lead: "Starting in an hour", rest: ` · ${item.activityTitle}` };
  }
}

export function isReminder(kind: AppNotification["kind"]) {
  return kind === "reminder_day" || kind === "reminder_hour";
}

export function isFollowNotice(kind: AppNotification["kind"]) {
  return kind === "follow_request" || kind === "followed";
}
