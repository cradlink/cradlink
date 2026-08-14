import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Search } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const nav = [
    { href: "/", label: t("nav.feed"), short: t("nav.feed") },
    { href: "/search", label: t("nav.explore"), short: t("nav.search") },
    { href: "/notifications", label: t("nav.alerts"), short: t("nav.alerts") },
    { href: "/me", label: t("nav.myActivities"), short: t("nav.mine") },
  ];
  const unread = useUnreadCount(user?.id);
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
          <LanguageSwitcher compact align="right" />
          <ThemeToggle />
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar name={user.displayName} src={user.avatarUrl} />
            </button>
            {open ? (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card py-1 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-medium">{user.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <MenuLink href="/notifications" onClick={() => setOpen(false)}>
                  {t("nav.notifications")}
                </MenuLink>
                <MenuLink href="/profile" onClick={() => setOpen(false)}>
                  {t("nav.profile")}
                </MenuLink>
                <MenuLink href="/me" onClick={() => setOpen(false)}>
                  {t("nav.myActivities")}
                </MenuLink>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={async () => {
                    setOpen(false);
                    await signOut();
                    navigate("/login");
                  }}
                >
                  {t("nav.signOut")}
                </button>
              </div>
            ) : null}
          </div>
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

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link to={href} onClick={onClick} className="block px-3 py-2 text-sm hover:bg-muted">
      {children}
    </Link>
  );
}
