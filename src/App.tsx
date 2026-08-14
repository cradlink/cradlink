import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/layouts/app-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { ActivityDetailPage } from "@/pages/activity-detail-page";
import { EditProfilePage } from "@/pages/edit-profile-page";
import { FeedPage } from "@/pages/feed-page";
import { LoginPage } from "@/pages/login-page";
import { MyActivitiesPage } from "@/pages/my-activities-page";
import { NewActivityPage } from "@/pages/new-activity-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ProfilePage } from "@/pages/profile-page";
import { PublicProfilePage } from "@/pages/public-profile-page";
import { SignupPage } from "@/pages/signup-page";

function RequireAuth() {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <BootScreen />;
  if (!user) {
    const next = location.pathname + location.search;
    const to = next && next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login";
    return <Navigate to={to} replace />;
  }
  return <Outlet />;
}

function GuestOnly() {
  const { user, ready } = useAuth();
  if (!ready) return <BootScreen />;
  if (user) return <Navigate to="/" replace />;
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

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/me" element={<MyActivitiesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/activities/new" element={<NewActivityPage />} />
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/u/:userId" element={<PublicProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
