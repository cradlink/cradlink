import type { Activity, ActivityMember, User } from "@/lib/types";

export const STORAGE_KEYS = {
  users: "cl_users",
  activities: "cl_activities",
  members: "cl_members",
  session: "cl_session",
  seed: "cl_seeded",
} as const;

export const SEED_VERSION = "7";

export type StoredUser = User & { passwordHash?: string };

export type LocalDb = {
  users: Record<string, StoredUser>;
  activities: Record<string, Activity>;
  members: Record<string, ActivityMember>;
};

function emptyDb(): LocalDb {
  return { users: {}, activities: {}, members: {} };
}

export function loadDb(): LocalDb {
  if (typeof window === "undefined") return emptyDb();
  try {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || "{}") as Record<
      string,
      StoredUser
    >;
    const activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.activities) || "{}") as Record<
      string,
      Activity
    >;
    const members = JSON.parse(localStorage.getItem(STORAGE_KEYS.members) || "{}") as Record<
      string,
      ActivityMember
    >;
    return { users, activities, members };
  } catch {
    return emptyDb();
  }
}

export function saveDb(db: LocalDb) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(db.users));
  localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(db.activities));
  localStorage.setItem(STORAGE_KEYS.members, JSON.stringify(db.members));
}

export function publicUser(user: StoredUser): User {
  const rest = { ...user };
  delete rest.passwordHash;
  return {
    ...rest,
    emailVerified: rest.emailVerified !== false,
    profileVisibility: rest.profileVisibility === "private" ? "private" : "public",
  };
}

export function getSessionUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.session);
}

export function setSessionUserId(userId: string | null) {
  if (typeof window === "undefined") return;
  if (userId) localStorage.setItem(STORAGE_KEYS.session, userId);
  else localStorage.removeItem(STORAGE_KEYS.session);
}
