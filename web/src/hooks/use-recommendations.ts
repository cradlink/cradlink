import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useCreatedActivities, useJoinedActivities } from "@/hooks/use-activities";
import { useOutgoingFollows } from "@/hooks/use-follows";
import { getBackend } from "@/lib/backend";
import { recommendActivities, type ScoredActivity } from "@/lib/recommend";
import type { Activity, User } from "@/lib/types";

const FOLLOWEE_JOIN_CAP = 20;

export function useRecommendations(user: User | null | undefined, candidates: Activity[]) {
  const created = useCreatedActivities(user?.id);
  const joined = useJoinedActivities(user?.id);
  const outgoing = useOutgoingFollows(user?.id);
  const backend = getBackend();

  const followedIds = useMemo(
    () =>
      (outgoing.data ?? [])
        .filter((row) => row.status === "accepted")
        .map((row) => row.followeeId)
        .slice(0, FOLLOWEE_JOIN_CAP),
    [outgoing.data],
  );

  const followeeJoins = useQueries({
    queries: followedIds.map((id) => ({
      queryKey: ["activities", "joined", id],
      queryFn: () => backend.activities.listJoinedBy(id),
      staleTime: 60_000,
    })),
  });

  const followedJoinedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const query of followeeJoins) {
      for (const activity of query.data ?? []) ids.add(activity.id);
    }
    return ids;
  }, [followeeJoins]);

  const picks = useMemo((): ScoredActivity[] => {
    if (!user) return [];
    const taste = [...(created.data ?? []), ...(joined.data ?? [])];
    const joinedIds = new Set((joined.data ?? []).map((activity) => activity.id));
    return recommendActivities(candidates, {
      user,
      tasteActivities: taste,
      followedIds: new Set(followedIds),
      followedJoinedIds,
      joinedIds,
    });
  }, [candidates, created.data, followedIds, followedJoinedIds, joined.data, user]);

  return {
    picks,
    isLoading: Boolean(user) && (created.isLoading || joined.isLoading || outgoing.isLoading),
  };
}
