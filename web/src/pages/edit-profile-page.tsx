import { ProfileForm } from "@/components/profile/profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export function EditProfilePage() {
  const { user, ready } = useAuth();
  if (!ready) return <Skeleton className="h-40 w-full" />;
  if (!user) return null;
  return <ProfileForm user={user} />;
}
