import { useMemo } from "react";
import { useSearchDirectory } from "@/hooks/use-search";
import { useOutgoingFollows } from "@/hooks/use-follows";
import { isDeactivated } from "@/lib/account";
import { canSeeProfileActivities } from "@/lib/follow";
import type { Activity } from "@/lib/types";

export function useVisibleActivities(viewerId: string | undefined, activities: Activity[]) {
  const directory = useSearchDirectory();
  const outgoing = useOutgoingFollows(viewerId);

  return useMemo(() => {
    const users = new Map((directory.people.data ?? []).map((user) => [user.id, user]));
    const accepted = new Set(
      (outgoing.data ?? []).filter((row) => row.status === "accepted").map((row) => row.followeeId),
    );
    return activities.filter((activity) => {
      if (activity.creatorId === viewerId) return true;
      const creator = users.get(activity.creatorId);
      if (!creator) return !directory.people.isLoading;
      if (isDeactivated(creator)) return false;
      return canSeeProfileActivities(viewerId, creator, accepted.has(activity.creatorId) ? "accepted" : null);
    });
  }, [activities, directory.people.data, directory.people.isLoading, outgoing.data, viewerId]);
}
