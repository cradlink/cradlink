import type { Activity, User } from "@/lib/types"

const PEOPLE_LIMIT = 7

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function matchesQuery(hay: string[], query: string) {
  const q = normalize(query)
  if (!q) return false
  return hay.join(" ").toLowerCase().includes(q)
}

function peopleScore(person: User, query: string) {
  const q = normalize(query)
  const name = normalize(person.displayName ?? "")
  const handle = normalize(person.username ?? "")
  if (!q || (!name && !handle)) return 0
  if (handle && (`@${handle}` === q || handle === q.replace(/^@/, ""))) return 420
  if (handle && handle.startsWith(q.replace(/^@/, ""))) return 360
  if (name === q) return 400
  if (name.startsWith(q)) return 300
  if (name.split(/\s+/).some((part) => part.startsWith(q))) return 220
  if (name.includes(q)) return 160
  const skills = (person.skills ?? []).some((skill) => normalize(skill).includes(q))
  if (skills) return 80
  if (normalize(person.bio ?? "").includes(q)) return 50
  if (normalize(person.location ?? "").includes(q)) return 20
  return 0
}

export function searchPeople(people: User[], query: string) {
  return people
    .map((person) => ({ person, score: peopleScore(person, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.person.displayName.localeCompare(b.person.displayName))
    .slice(0, PEOPLE_LIMIT)
    .map((row) => row.person)
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
