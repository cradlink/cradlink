import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Fab } from "@/components/layout/fab";
import { MobileTabBar, hideMobileChrome } from "@/components/layout/mobile-tab-bar";
import { SideNav } from "@/components/layout/side-nav";
import { useActivityReminders } from "@/hooks/use-activity-reminders";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function AppLayout() {
  useActivityReminders();
  const { user } = useAuth();
  const unread = useUnreadCount(user?.id);
  const pathname = useLocation().pathname;
  const compact = hideMobileChrome(pathname);

  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) Cradlink` : "Cradlink";
    return () => {
      document.title = "Cradlink";
    };
  }, [unread]);

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex max-w-[1265px] justify-center">
        <SideNav />
        <main
          className={cn(
            "min-h-dvh w-full min-w-0 max-w-[600px] overflow-x-hidden border-border lg:border-x",
            compact ? "pb-0" : "pb-[calc(53px+env(safe-area-inset-bottom))] lg:pb-0",
          )}
        >
          <Outlet />
        </main>
      </div>
      <div className="lg:hidden">
        <Fab />
        <MobileTabBar />
      </div>
    </div>
  );
}
