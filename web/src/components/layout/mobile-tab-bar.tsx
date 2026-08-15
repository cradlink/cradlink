import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Home, Search, UserRound } from "lucide-react";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function hideMobileChrome(pathname: string) {
  return (
    pathname === "/activities/new" ||
    pathname === "/profile/edit" ||
    pathname.startsWith("/activities/edit/") ||
    /\/activities\/[^/]+\/edit$/.test(pathname)
  );
}

export function MobileTabBar() {
  const { t } = useTranslation();
  const pathname = useLocation().pathname;
  const { user } = useAuth();
  const unread = useUnreadCount(user?.id);
  if (hideMobileChrome(pathname)) return null;

  const items = [
    {
      href: "/",
      label: t("nav.home"),
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/search",
      label: t("nav.explore"),
      icon: Search,
      active: pathname === "/search" || pathname === "/explore",
    },
    {
      href: "/notifications",
      label: t("nav.notifications"),
      icon: Bell,
      active: pathname.startsWith("/notifications"),
      badge: unread,
    },
    {
      href: "/profile",
      label: t("nav.profile"),
      icon: UserRound,
      active: pathname === "/profile" || pathname.startsWith("/profile/"),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-[53px] max-w-[600px] items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              aria-label={item.label}
              className="relative flex flex-1 items-center justify-center text-foreground"
            >
              <span className="relative">
                <Icon className={cn("size-[26px]", item.active ? "stroke-[2.4]" : "stroke-[1.7]")} />
                {item.badge ? <NotificationBadge count={item.badge} /> : null}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
