import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getBackend } from "@/lib/backend";

export function useJoinLeave() {
  const backend = getBackend();
  const queryClient = useQueryClient();

  const invalidate = async (activityId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["activity", activityId] }),
      queryClient.invalidateQueries({ queryKey: ["members", activityId] }),
      queryClient.invalidateQueries({ queryKey: ["membership", activityId] }),
      queryClient.invalidateQueries({ queryKey: ["activities"] }),
    ]);
  };

  const join = useMutation({
    mutationFn: ({ activityId, userId }: { activityId: string; userId: string }) =>
      backend.members.join(activityId, userId),
    onSuccess: (_data, vars) => invalidate(vars.activityId),
  });

  const leave = useMutation({
    mutationFn: ({ activityId, userId }: { activityId: string; userId: string }) =>
      backend.members.leave(activityId, userId),
    onSuccess: (_data, vars) => invalidate(vars.activityId),
  });

  const accept = useMutation({
    mutationFn: ({
      activityId,
      userId,
      actorId,
    }: {
      activityId: string;
      userId: string;
      actorId: string;
    }) => backend.members.accept(activityId, userId, actorId),
    onSuccess: (_data, vars) => invalidate(vars.activityId),
  });

  const decline = useMutation({
    mutationFn: ({
      activityId,
      userId,
      actorId,
    }: {
      activityId: string;
      userId: string;
      actorId: string;
    }) => backend.members.decline(activityId, userId, actorId),
    onSuccess: (_data, vars) => invalidate(vars.activityId),
  });

  return { join, leave, accept, decline };
}
