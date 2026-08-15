import type { User } from "@/lib/types"

export function personLook(
  getUser: (id: string) => User | null,
  userId: string | null | undefined,
  fallbackName?: string | null,
  fallbackAvatar?: string | null,
) {
  const person = userId ? getUser(userId) : null
  return {
    name: person?.displayName || fallbackName || "Member",
    avatar: person ? person.avatarUrl : fallbackAvatar ?? null,
  }
}
