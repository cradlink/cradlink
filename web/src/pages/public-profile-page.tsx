import { useParams } from "react-router-dom";
import { ProfileView } from "@/components/profile/profile-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-profile";

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me } = useAuth();
  const { data, isLoading } = useUser(userId);

  if (isLoading) return <Skeleton className="m-4 h-40 w-auto" />;
  if (!data) {
    return (
      <div className="px-8 py-16 text-center">
        <h1 className="text-3xl font-bold">No one here by that name.</h1>
      </div>
    );
  }

  return <ProfileView user={data} isSelf={me?.id === data.id} />;
}
