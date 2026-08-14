import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBackend } from "@/lib/backend";

export function useNotifications(userId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => backend.notifications.list(userId!),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });
}

export function useUnreadCount(userId: string | undefined) {
  const list = useNotifications(userId);
  return list.data?.filter((item) => !item.read).length ?? 0;
}

export function useMarkNotificationRead() {
  const backend = getBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => backend.notifications.markRead(id, userId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", vars.userId] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const backend = getBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => backend.notifications.markAllRead(userId),
    onSuccess: (_data, userId) => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });
}
