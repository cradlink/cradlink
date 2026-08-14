import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBackend } from "@/lib/backend";
import { isDeactivated } from "@/lib/account";
import { matchesActivity, matchesUser, normalizeQuery } from "@/lib/search";

export function useSearchDirectory() {
  const backend = getBackend();
  const people = useQuery({
    queryKey: ["users", "directory"],
    queryFn: () => backend.users.list(200),
    staleTime: 30_000,
  });
  const activities = useQuery({
    queryKey: ["activities", "directory"],
    queryFn: async () => {
      const page = await backend.activities.list({ limit: 100 });
      return page.items;
    },
    staleTime: 30_000,
  });
  return { people, activities };
}

export function useSearchResults(query: string) {
  const directory = useSearchDirectory();
  const q = normalizeQuery(query);

  const people = useMemo(() => {
    if (!q) return [];
    return (directory.people.data ?? [])
      .filter((user) => !isDeactivated(user) && matchesUser(user, q))
      .slice(0, 30);
  }, [directory.people.data, q]);

  const activities = useMemo(() => {
    if (!q) return [];
    return (directory.activities.data ?? []).filter((activity) => matchesActivity(activity, q)).slice(0, 30);
  }, [directory.activities.data, q]);

  return {
    query: q,
    people,
    activities,
    isLoading: directory.people.isLoading || directory.activities.isLoading,
    isError: directory.people.isError || directory.activities.isError,
  };
}
