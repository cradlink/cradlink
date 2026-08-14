import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBackend } from "@/lib/backend";
import type { ActivityComment } from "@/lib/types";

export function useActivityComments(activityId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["comments", activityId],
    queryFn: () => backend.comments.listByActivity(activityId!),
    enabled: Boolean(activityId),
    refetchInterval: 15_000,
  });
}

export function useCreateComment() {
  const backend = getBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      activityId: string;
      authorId: string;
      body: string;
      parentId?: string | null;
    }) => backend.comments.create(input),
    onSuccess: (comment, vars) => {
      queryClient.setQueryData<ActivityComment[]>(["comments", vars.activityId], (current) => {
        const list = current ?? [];
        if (list.some((row) => row.id === comment.id)) return list;
        return [...list, comment];
      });
      void queryClient.invalidateQueries({ queryKey: ["comments", vars.activityId] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
