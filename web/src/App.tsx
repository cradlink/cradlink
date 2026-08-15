import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/layouts/app-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { ActivityDetailPage } from "@/pages/activity-detail-page";
import { EditActivityPage } from "@/pages/edit-activity-page";
import { EditProfilePage } from "@/pages/edit-profile-page";
import { FeedPage } from "@/pages/feed-page";
import { ConnectionsPage } from "@/pages/connections-page";
import { FollowRequestsPage } from "@/pages/follow-requests-page";
import { LoginPage } from "@/pages/login-page";
import { MyActivitiesPage } from "@/pages/my-activities-page";
import { NewActivityPage } from "@/pages/new-activity-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ProfilePage } from "@/pages/profile-page";
import { PublicProfilePage } from "@/pages/public-profile-page";
import { SearchPage } from "@/pages/search-page";
import { SettingsAccountPage } from "@/pages/settings-account-page";
import { SettingsDisplayPage } from "@/pages/settings-display-page";
import { SettingsLanguagePage } from "@/pages/settings-language-page";
import { SettingsNotificationsPage } from "@/pages/settings-notifications-page";
import { ReactivatePage } from "@/pages/reactivate-page";
import { SettingsDeactivatePage } from "@/pages/settings-deactivate-page";
import { SettingsPage } from "@/pages/settings-page";
import { SignupPage } from "@/pages/signup-page";
import { VerifyEmailPage } from "@/pages/verify-email-page";
import { isDeactivated } from "@/lib/account";
import { needsEmailVerification } from "@/lib/types";

function RequireAuth() {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <BootScreen />;
  if (!user) {
    const next = location.pathname + location.search;
    const to = next && next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login";
    return <Navigate to={to} replace />;
  }
  if (needsEmailVerification(user)) return <Navigate to="/verify-email" replace />;
  if (isDeactivated(user)) return <Navigate to="/reactivate" replace />;
  return <Outlet />;
}

function GuestOnly() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <BootScreen />;
  if (needsEmailVerification(user)) return <Navigate to="/verify-email" replace />;
  if (user && isDeactivated(user)) return <Navigate to="/reactivate" replace />;
  if (user) {
    const next = new URLSearchParams(location.search).get("next");
    return <Navigate to={next && next.startsWith("/") ? next : "/"} replace />;
  }
  return <Outlet />;
}

function BootScreen() {
  return <div className="min-h-dvh bg-background" />;
}

export function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reactivate" element={<ReactivatePage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/explore" element={<SearchPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/notifications/requests" element={<FollowRequestsPage />} />
          <Route path="/me" element={<MyActivitiesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/profile/followers" element={<ConnectionsPage tab="followers" />} />
          <Route path="/profile/following" element={<ConnectionsPage tab="following" />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/account" element={<SettingsAccountPage />} />
          <Route path="/settings/deactivate" element={<SettingsDeactivatePage />} />
          <Route path="/settings/display" element={<SettingsDisplayPage />} />
          <Route path="/settings/language" element={<SettingsLanguagePage />} />
          <Route path="/settings/notifications" element={<SettingsNotificationsPage />} />
          <Route path="/activities/new" element={<NewActivityPage />} />
          <Route path="/activities/edit/:id" element={<EditActivityPage />} />
          <Route path="/activities/:id/edit" element={<EditActivityPage />} />
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/u/:userId/followers" element={<ConnectionsPage tab="followers" />} />
          <Route path="/u/:userId/following" element={<ConnectionsPage tab="following" />} />
          <Route path="/u/:userId" element={<PublicProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
