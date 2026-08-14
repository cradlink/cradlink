import type { User } from "@/lib/types";

export const DEACTIVATION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isDeactivated(user: Pick<User, "deactivatedAt"> | null | undefined) {
  return Boolean(user?.deactivatedAt);
}

export function isDeactivationExpired(user: Pick<User, "deactivatedAt"> | null | undefined) {
  if (!user?.deactivatedAt) return false;
  const started = new Date(user.deactivatedAt).getTime();
  if (Number.isNaN(started)) return false;
  return Date.now() - started >= DEACTIVATION_DAYS * DAY_MS;
}

export function deactivationEndsAt(deactivatedAt: string) {
  return new Date(new Date(deactivatedAt).getTime() + DEACTIVATION_DAYS * DAY_MS);
}
