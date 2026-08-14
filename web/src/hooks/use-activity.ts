import { useQuery } from "@tanstack/react-query";
import { getBackend } from "@/lib/backend";

export function useActivity(id: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["activity", id],
    queryFn: () => backend.activities.getById(id!),
    enabled: Boolean(id),
  });
}

export function useActivityMembers(activityId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["members", activityId],
    queryFn: () => backend.members.listByActivity(activityId!),
    enabled: Boolean(activityId),
  });
}

export function useMembership(activityId: string | undefined, userId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["membership", activityId, userId],
    queryFn: () => backend.members.getMembership(activityId!, userId!),
    enabled: Boolean(activityId && userId),
  });
}
