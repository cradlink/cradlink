import type { Activity, User } from "@/lib/types"

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function matchesQuery(hay: string[], query: string) {
  const q = normalize(query)
  if (!q) return false
  return hay.join(" ").toLowerCase().includes(q)
}

export function searchPeople(people: User[], query: string) {
  return people.filter((person) =>
    matchesQuery(
      [person.displayName ?? "", person.location ?? "", person.bio ?? "", ...(person.skills ?? [])],
      query,
    ),
  )
}

export function searchActivities(activities: Activity[], query: string) {
  return activities.filter((activity) =>
    matchesQuery(
      [
        activity.title ?? "",
        activity.description ?? "",
        activity.creatorName ?? "",
        ...(activity.tags ?? []),
        activity.location?.city ?? "",
        activity.location?.venue ?? "",
      ],
      query,
    ),
  )
}
