import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { isReminder, notificationCopy } from "@/components/notifications/notification-copy";
import { Avatar } from "@/components/ui/avatar";
import { formatCompactTime } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NotificationRow({
  item,
  onOpen,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
}) {
  const copy = notificationCopy(item);
  return (
    <Link
      to={
        item.kind === "comment" || item.kind === "reply"
          ? item.commentId
            ? `/activities/${item.activityId}#c-${item.commentId}`
            : `/activities/${item.activityId}#discussion`
          : `/activities/${item.activityId}`
      }
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
        <Avatar name={item.actorName || "Member"} src={item.actorAvatar} />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-5">
          <span className="font-bold">{copy.lead}</span>
          <span>{copy.rest}</span>
        </p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{formatCompactTime(item.createdAt)}</p>
      </div>
      {!item.read ? <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" /> : null}
    </Link>
  );
}
