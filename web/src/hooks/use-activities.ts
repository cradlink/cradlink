import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBackend } from "@/lib/backend";
import type { ActivityFilters, CreateActivityInput, UpdateActivityInput, User } from "@/lib/types";

export function useActivityFeed(filters: Pick<ActivityFilters, "type" | "locationType">) {
  const backend = getBackend();
  return useInfiniteQuery({
    queryKey: ["activities", filters],
    queryFn: ({ pageParam }) =>
      backend.activities.list({
        ...filters,
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useCreatedActivities(userId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["activities", "created", userId],
    queryFn: () => backend.activities.listCreatedBy(userId!),
    enabled: Boolean(userId),
  });
}

export function useJoinedActivities(userId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["activities", "joined", userId],
    queryFn: () => backend.activities.listJoinedBy(userId!),
    enabled: Boolean(userId),
  });
}

export function useCreateActivity() {
  const backend = getBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ creator, input }: { creator: User; input: CreateActivityInput }) =>
      backend.activities.create(creator, input),
    onSuccess: (activity) => {
      queryClient.setQueryData(["activity", activity.id], activity);
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateActivity() {
  const backend = getBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      actorId,
      input,
    }: {
      id: string;
      actorId: string;
      input: UpdateActivityInput;
    }) => backend.activities.update(id, actorId, input),
    onSuccess: (activity) => {
      queryClient.setQueryData(["activity", activity.id], activity);
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
