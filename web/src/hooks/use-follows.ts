import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getBackend } from "@/lib/backend";
import type { Follow } from "@/lib/types";

function invalidateFollows(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["follows"] });
  void queryClient.invalidateQueries({ queryKey: ["notifications"] });
}

function rememberFollow(
  queryClient: ReturnType<typeof useQueryClient>,
  follow: Follow | null,
  followerId: string,
  followeeId: string,
) {
  queryClient.setQueryData(["follows", "one", followerId, followeeId], follow);
  queryClient.setQueryData<Follow[]>(["follows", "out", followerId], (current) => {
    const rows = current ?? [];
    const next = rows.filter((row) => row.followeeId !== followeeId);
    return follow ? [...next, follow] : next;
  });
}

export function useFollow(followerId: string | undefined, followeeId: string | undefined) {
  const backend = getBackend();
  const { user: me } = useAuth();
  const mineOutgoing = useOutgoingFollows(me?.id && followerId === me.id ? me.id : undefined);
  const mineIncoming = useIncomingFollows(me?.id && followeeId === me.id ? me.id : undefined);
  const one = useQuery({
    queryKey: ["follows", "one", followerId, followeeId],
    queryFn: () => backend.follows.get(followerId!, followeeId!),
    enabled: Boolean(followerId && followeeId && followerId !== followeeId),
  });

  const fromOutgoing = mineOutgoing.data?.find(
    (row) => row.followerId === followerId && row.followeeId === followeeId,
  );
  const fromIncoming = mineIncoming.data?.find(
    (row) => row.followerId === followerId && row.followeeId === followeeId,
  );
  const data = fromOutgoing ?? fromIncoming ?? one.data ?? null;

  return {
    ...one,
    data,
    isLoading: !data && (one.isLoading || mineOutgoing.isLoading || mineIncoming.isLoading),
  };
}

export function useOutgoingFollows(userId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["follows", "out", userId],
    queryFn: () => backend.follows.listOutgoing(userId!),
    enabled: Boolean(userId),
  });
}

export function useIncomingFollows(userId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["follows", "in", userId],
    queryFn: () => backend.follows.listIncoming(userId!),
    enabled: Boolean(userId),
  });
}

export function useFollowers(userId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["follows", "followers", userId],
    queryFn: () => backend.follows.listFollowers(userId!),
    enabled: Boolean(userId),
  });
}

export function useFollowing(userId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["follows", "following", userId],
    queryFn: () => backend.follows.listFollowing(userId!),
    enabled: Boolean(userId),
  });
}

export function useFollowRequests(userId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["follows", "requests", userId],
    queryFn: () => backend.follows.listRequests(userId!),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });
}

export function useFollowActions() {
  const backend = getBackend();
  const queryClient = useQueryClient();

  const follow = useMutation({
    mutationFn: ({ actorId, targetId }: { actorId: string; targetId: string }) =>
      backend.follows.follow(actorId, targetId),
    onSuccess: (result, { actorId, targetId }) => {
      rememberFollow(queryClient, result, actorId, targetId);
      invalidateFollows(queryClient);
    },
  });

  const unfollow = useMutation({
    mutationFn: ({ actorId, targetId }: { actorId: string; targetId: string }) =>
      backend.follows.unfollow(actorId, targetId),
    onSuccess: (_void, { actorId, targetId }) => {
      rememberFollow(queryClient, null, actorId, targetId);
      invalidateFollows(queryClient);
    },
  });

  const accept = useMutation({
    mutationFn: ({ actorId, followerId }: { actorId: string; followerId: string }) =>
      backend.follows.accept(actorId, followerId),
    onSuccess: (result, { actorId, followerId }) => {
      rememberFollow(queryClient, result, followerId, actorId);
      invalidateFollows(queryClient);
    },
  });

  const decline = useMutation({
    mutationFn: ({ actorId, followerId }: { actorId: string; followerId: string }) =>
      backend.follows.decline(actorId, followerId),
    onSuccess: () => invalidateFollows(queryClient),
  });

  return { follow, unfollow, accept, decline };
}
