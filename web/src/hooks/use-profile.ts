import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBackend } from "@/lib/backend";
import type { UpdateProfileInput } from "@/lib/types";

export function useUser(userId: string | undefined) {
  const backend = getBackend();
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => backend.users.getById(userId!),
    enabled: Boolean(userId),
  });
}

export function useUpdateProfile(userId: string | undefined) {
  const backend = getBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: UpdateProfileInput) => {
      if (!userId) throw new Error("Not signed in");
      return backend.users.update(userId, patch);
    },
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUploadAvatar() {
  const backend = getBackend();
  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      backend.storage.uploadAvatar(userId, file),
  });
}

export function useUploadActivityImages() {
  const backend = getBackend();
  return useMutation({
    mutationFn: ({ userId, files }: { userId: string; files: File[] }) =>
      Promise.all(files.map((file) => backend.storage.uploadActivityImage(userId, file))),
  });
}
