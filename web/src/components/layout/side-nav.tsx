import { Home, Search, Bell, CalendarDays, UserRound, PenSquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function SideNav() {
  const { t } = useTranslation();
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const unread = useUnreadCount(user?.id);
  const items = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/search", label: t("nav.explore"), icon: Search },
    { href: "/notifications", label: t("nav.notifications"), icon: Bell },
    { href: "/me", label: t("nav.myActivities"), icon: CalendarDays },
    { href: "/profile", label: t("nav.profile"), icon: UserRound },
  ];

  return (
    <aside className="sticky top-0 hidden h-dvh w-[88px] shrink-0 flex-col justify-between px-2 py-2 xl:w-[275px] lg:flex">
      <div>
        <div className="px-3 py-3">
          <Logo wordmarkClassName="hidden xl:inline-block" />
        </div>
        <nav className="mt-1 space-y-1">
          {items.map((item) => {
            const active =
              item.href === "/search"
                ? pathname === "/search" || pathname === "/explore"
                : item.href === "/notifications"
                  ? pathname.startsWith("/notifications")
                  : item.href === "/profile"
                    ? pathname === "/profile" || pathname.startsWith("/u/")
                    : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-5 rounded-full px-3 py-3 text-xl hover:bg-hover",
                  active ? "font-bold" : "font-normal",
                )}
              >
                <span className="relative">
                  <Icon className="size-7" strokeWidth={active ? 2.4 : 1.8} />
                  {item.href === "/notifications" ? <NotificationBadge count={unread} /> : null}
                </span>
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Link
          to="/activities/new"
          className="mt-4 flex items-center justify-center rounded-full bg-primary px-3 py-3 text-[17px] font-bold text-primary-foreground hover:bg-[#1a8cd8] xl:mx-2"
        >
          <PenSquare className="size-6 xl:hidden" />
          <span className="hidden xl:inline">{t("nav.create")}</span>
        </Link>
      </div>

      <div className="space-y-1 pb-2">
        <div className="flex items-center justify-between px-2">
          <ThemeToggle />
          <span className="xl:hidden">
            <LanguageSwitcher compact />
          </span>
          <span className="hidden xl:inline-flex">
            <LanguageSwitcher />
          </span>
        </div>
        {user ? (
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
            className="flex w-full items-center gap-3 rounded-full px-3 py-3 text-left hover:bg-hover"
          >
            <Avatar name={user.displayName} src={user.avatarUrl} />
            <span className="hidden min-w-0 flex-1 xl:block">
              <span className="block truncate text-[15px] font-bold leading-5">{user.displayName}</span>
              <span className="block truncate text-[13px] leading-4 text-muted-foreground">{t("nav.signOut")}</span>
            </span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}
