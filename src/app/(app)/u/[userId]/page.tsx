"use client";

import { use } from "react";
import { ProfileView } from "@/components/profile/profile-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-profile";

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
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

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 px-4 py-3 backdrop-blur-md">
        <h1 className="truncate text-xl font-bold">{data.displayName}</h1>
      </div>
      <div className="px-4 py-4">
        <ProfileView user={data} isSelf={me?.id === data.id} />
      </div>
    </div>
  );
}
