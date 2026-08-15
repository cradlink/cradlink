import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { FollowRequestActions } from "@/components/notifications/follow-request-row";
import { NOTIFICATION_COPY_KEY, isFollowNotice, isReminder } from "@/components/notifications/notification-copy";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-profile";
import { formatCompactTime } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

function NotificationCopy({ item }: { item: AppNotification }) {
  const { t } = useTranslation();
  return (
    <Trans
      i18nKey={NOTIFICATION_COPY_KEY[item.kind]}
      values={{
        name: item.actorName || t("common.someone"),
        title: item.activityTitle ?? "",
      }}
      components={{ bold: <span className="font-bold" /> }}
    />
  );
}

export function NotificationRow({
  item,
  onOpen,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const actor = useUser(item.kind === "follow_request" ? item.actorId : undefined);
  const to = isFollowNotice(item.kind)
    ? `/u/${item.actorId}`
    : item.kind === "comment" || item.kind === "reply"
      ? item.commentId
        ? `/activities/${item.activityId}#c-${item.commentId}`
        : `/activities/${item.activityId}#discussion`
      : `/activities/${item.activityId}`;

  if (item.kind === "follow_request" && user && item.actorId) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 border-b border-border px-4 py-3",
          !item.read && "bg-[#1d9bf00f]",
        )}
      >
        <Link to={`/u/${item.actorId}`} onClick={() => onOpen(item)} className="shrink-0">
          <Avatar name={item.actorName || t("common.member")} src={item.actorAvatar} />
        </Link>
        <Link to={`/u/${item.actorId}`} onClick={() => onOpen(item)} className="min-w-0 flex-1">
          <p className="text-[15px] leading-5">
            <NotificationCopy item={item} />
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{formatCompactTime(item.createdAt)}</p>
        </Link>
        {actor.data ? <FollowRequestActions meId={user.id} follower={actor.data} /> : null}
      </div>
    );
  }

  return (
    <Link
      to={to}
      onClick={() => onOpen(item)}
      className={cn(
        "flex gap-3 border-b border-border px-4 py-3 hover:bg-hover",
        !item.read && "bg-[#1d9bf00f]",
      )}
    >
      {isReminder(item.kind) ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1d9bf01a] text-primary">
          <Bell className="size-5" />
        </span>
      ) : (
        <Avatar name={item.actorName || t("common.member")} src={item.actorAvatar} />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-5">
          <NotificationCopy item={item} />
        </p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{formatCompactTime(item.createdAt)}</p>
      </div>
      {!item.read ? <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" /> : null}
    </Link>
  );
}
