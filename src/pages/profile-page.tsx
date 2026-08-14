import { ProfileView } from "@/components/profile/profile-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export function ProfilePage() {
  const { user, ready } = useAuth();
  if (!ready) return <Skeleton className="h-40 w-full" />;
  if (!user) return null;
  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">Profile</h1>
      </div>
      <div className="px-4 py-4">
        <ProfileView user={user} isSelf />
      </div>
    </div>
  );
}
