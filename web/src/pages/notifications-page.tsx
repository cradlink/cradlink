import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { NotificationRow } from "@/components/notifications/notification-row";
import { isFollowNotice, isReminder } from "@/components/notifications/notification-copy";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useFollowRequests } from "@/hooks/use-follows";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import type { AppNotification } from "@/lib/types";

export function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const list = useNotifications(user?.id);
  const requests = useFollowRequests(user?.id);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [tab, setTab] = useState("all");
  const pending = requests.data ?? [];
  const [alertsOn, setAlertsOn] = useState(
    () => typeof Notification !== "undefined" && Notification.permission === "granted",
  );

  const items = useMemo(() => {
    const all = list.data ?? [];
    if (tab === "activity") return all.filter((item) => isReminder(item.kind));
    return all.filter((item) => !isFollowNotice(item.kind) || item.kind === "followed");
  }, [list.data, tab]);

  function onOpen(item: AppNotification) {
    if (!user || item.read) return;
    void markRead.mutateAsync({ id: item.id, userId: user.id });
  }

  async function enableAlerts() {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setAlertsOn(permission === "granted");
  }

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h1 className="min-w-0 truncate text-xl font-bold">{t("notifications.title")}</h1>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {!alertsOn ? (
              <button type="button" onClick={() => void enableAlerts()} className="text-[13px] text-primary">
                {t("notifications.turnOnAlerts")}
              </button>
            ) : null}
            {user && (list.data ?? []).some((item) => !item.read) ? (
              <button
                type="button"
                onClick={() => void markAll.mutateAsync(user.id)}
                className="text-[13px] text-primary"
              >
                {t("notifications.markAllRead")}
              </button>
            ) : null}
          </div>
        </div>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "all", label: t("notifications.tabAll") },
            { value: "activity", label: t("notifications.tabActivity") },
          ]}
        />
      </div>

      {pending.length > 0 ? (
        <Link
          to="/notifications/requests"
          className="flex items-center gap-3 border-b border-border px-4 py-3 hover:bg-hover"
        >
          <div className="flex -space-x-2">
            {pending.slice(0, 3).map((request) => (
              <Avatar
                key={request.id}
                name={request.user.displayName}
                src={request.user.avatarUrl}
                className="ring-2 ring-background"
              />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-5">{t("notifications.followRequests")}</p>
            <p className="text-[13px] text-muted-foreground">
              {t("follows.requestCount", { count: pending.length })}
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
      ) : null}

      {list.isLoading ? (
        <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">{t("common.loading")}</p>
      ) : null}

      {!list.isLoading && items.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <h2 className="text-3xl font-bold">{t("notifications.emptyTitle")}</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">{t("notifications.emptyBody")}</p>
        </div>
      ) : null}

      <div>
        {items.map((item) => (
          <NotificationRow key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
