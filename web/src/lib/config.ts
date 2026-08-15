import { appEnv } from "@/lib/env";

export const APP_NAME = "Cradlink";
export const APP_TAGLINE = "Find people. Do the thing.";

export const SESSION_COOKIE = "cl_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const PAGE_SIZE = 8;

export type BackendName = "local" | "firebase";

export function getBackendName(): BackendName {
  return appEnv.backend === "firebase" ? "firebase" : "local";
}
