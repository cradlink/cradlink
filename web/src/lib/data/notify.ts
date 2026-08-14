import type { NotificationsRepo } from "@/lib/data/types";
import type { Activity, AppNotification, NotificationKind, User } from "@/lib/types";
import { createId, nowIso } from "@/lib/utils";

export function reminderId(kind: "reminder_day" | "reminder_hour", activityId: string, userId: string) {
  return `${kind}_${activityId}_${userId}`;
}

export function socialId(kind: NotificationKind, activityId: string, actorId: string) {
  return `${kind}_${activityId}_${actorId}`;
}

export async function notify(
  repo: NotificationsRepo,
  input: Omit<AppNotification, "createdAt" | "read">,
) {
  return repo.ensure({
    ...input,
    createdAt: nowIso(),
    read: false,
  });
}

export async function notifyJoin(
  repo: NotificationsRepo,
  activity: Activity,
  actor: Pick<User, "id" | "displayName" | "avatarUrl">,
) {
  if (activity.creatorId === actor.id) return;
  const kind = activity.joinPolicy === "manual" ? "join_request" : "joined";
  return notify(repo, {
    id: socialId(kind, activity.id, actor.id),
    recipientId: activity.creatorId,
    kind,
    activityId: activity.id,
    activityTitle: activity.title,
    actorId: actor.id,
    actorName: actor.displayName,
    actorAvatar: actor.avatarUrl,
  });
}

export async function notifyDecision(
  repo: NotificationsRepo,
  activity: Activity,
  userId: string,
  kind: "accepted" | "declined",
) {
  return notify(repo, {
    id: socialId(kind, activity.id, userId),
    recipientId: userId,
    kind,
    activityId: activity.id,
    activityTitle: activity.title,
    actorId: activity.creatorId,
    actorName: activity.creatorName,
    actorAvatar: activity.creatorAvatar,
  });
}

export async function notifyActivityEdited(
  repo: NotificationsRepo,
  activity: Activity,
  actor: Pick<User, "id" | "displayName" | "avatarUrl">,
  memberUserIds: string[],
) {
  const stamp = createId("n");
  await Promise.all(
    [...new Set(memberUserIds)]
      .filter((id) => id && id !== actor.id)
      .map((recipientId) =>
        notify(repo, {
          id: `edited_${activity.id}_${recipientId}_${stamp}`,
          recipientId,
          kind: "edited",
          activityId: activity.id,
          activityTitle: activity.title,
          actorId: actor.id,
          actorName: actor.displayName,
          actorAvatar: actor.avatarUrl,
        }),
      ),
  );
}
