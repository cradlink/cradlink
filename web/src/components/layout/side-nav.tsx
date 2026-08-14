import { Home, Bell, CalendarDays, UserRound, PenSquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/me", label: "My activities", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function SideNav() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const unread = useUnreadCount(user?.id);

  return (
    <aside className="sticky top-0 hidden h-dvh w-[88px] shrink-0 flex-col justify-between px-2 py-2 xl:w-[275px] lg:flex">
      <div>
        <div className="px-3 py-3">
          <Logo wordmarkClassName="hidden xl:inline-block" />
        </div>
        <nav className="mt-1 space-y-1">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
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
                  {item.href === "/notifications" && unread > 0 ? (
                    <span className="absolute -right-1.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                      {unread > 20 ? "20+" : unread}
                    </span>
                  ) : null}
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
          <span className="hidden xl:inline">Create</span>
        </Link>
      </div>

      <div className="space-y-1 pb-2">
        <div className="flex items-center justify-between px-2">
          <ThemeToggle />
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
              <span className="block truncate text-[13px] leading-4 text-muted-foreground">Sign out</span>
            </span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}
