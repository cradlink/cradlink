import { ProfileView } from "@/components/profile/profile-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export function ProfilePage() {
  const { user, ready } = useAuth();
  if (!ready) return <Skeleton className="h-40 w-full" />;
  if (!user) return null;
  return <ProfileView user={user} isSelf />;
}
