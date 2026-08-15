import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Search } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const nav = [
    { href: "/", label: t("nav.feed"), short: t("nav.feed") },
    { href: "/search", label: t("nav.explore"), short: t("nav.search") },
    { href: "/notifications", label: t("nav.alerts"), short: t("nav.alerts") },
    { href: "/me", label: t("nav.myActivities"), short: t("nav.mine") },
  ];
  const unread = useUnreadCount(user?.id);
  const pathname = useLocation().pathname;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-4">
        <Logo />
        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm",
                pathname === item.href || (item.href === "/search" && pathname === "/explore")
                  ? "font-bold text-foreground"
                  : "text-muted-foreground hover:bg-hover hover:text-foreground",
              )}
            >
              <span className="sm:hidden">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link
            to="/search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
            aria-label={t("nav.search")}
          >
            <Search className="size-5" />
          </Link>
          <Link
            to="/notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
            aria-label={t("nav.notifications")}
          >
            <Bell className="size-5" />
            <NotificationBadge count={unread} className="right-0 top-0" />
          </Link>
          <ThemeToggle />
        {user ? (
          <Link
            to="/profile"
            className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("nav.profile")}
          >
            <Avatar name={user.displayName} src={user.avatarUrl} />
          </Link>
        ) : (
          <Link to="/login" className="text-sm text-muted-foreground">
            {t("nav.signIn")}
          </Link>
        )}
        </div>
      </div>
    </header>
  );
}
