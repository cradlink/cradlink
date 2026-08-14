import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/config";

export function setSessionCookie(userId: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(userId)}; path=/; max-age=${SESSION_MAX_AGE}; samesite=lax`;
}

export function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
