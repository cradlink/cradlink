import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Fab } from "@/components/layout/fab";
import { Header } from "@/components/layout/header";
import { SideNav } from "@/components/layout/side-nav";
import { useActivityReminders } from "@/hooks/use-activity-reminders";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";

export function AppLayout() {
  useActivityReminders();
  const { user } = useAuth();
  const unread = useUnreadCount(user?.id);

  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) Cradlink` : "Cradlink";
    return () => {
      document.title = "Cradlink";
    };
  }, [unread]);

  return (
    <div className="min-h-dvh bg-background">
      <div className="lg:hidden">
        <Header />
      </div>
      <div className="mx-auto flex min-h-dvh max-w-[1265px] justify-center">
        <SideNav />
        <main className="min-h-dvh w-full max-w-[600px] border-border lg:border-x">
          <Outlet />
        </main>
      </div>
      <div className="lg:hidden">
        <Fab />
      </div>
    </div>
  );
}
