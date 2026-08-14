import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBackend } from "@/lib/backend";

function invalidateFollows(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["follows"] });
  void queryClient.invalidateQueries({ queryKey: ["notifications"] });
}

export function useFollow(followerId: string | undefined, followeeId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["follows", "one", followerId, followeeId],
    queryFn: () => backend.follows.get(followerId!, followeeId!),
    enabled: Boolean(followerId && followeeId && followerId !== followeeId),
  });
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
    onSuccess: () => invalidateFollows(queryClient),
  });

  const unfollow = useMutation({
    mutationFn: ({ actorId, targetId }: { actorId: string; targetId: string }) =>
      backend.follows.unfollow(actorId, targetId),
    onSuccess: () => invalidateFollows(queryClient),
  });

  const accept = useMutation({
    mutationFn: ({ actorId, followerId }: { actorId: string; followerId: string }) =>
      backend.follows.accept(actorId, followerId),
    onSuccess: () => invalidateFollows(queryClient),
  });

  const decline = useMutation({
    mutationFn: ({ actorId, followerId }: { actorId: string; followerId: string }) =>
      backend.follows.decline(actorId, followerId),
    onSuccess: () => invalidateFollows(queryClient),
  });

  return { follow, unfollow, accept, decline };
}
