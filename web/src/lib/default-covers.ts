import { appEnv } from "@/lib/env";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/types";

const NAMED_KEYS = ["spacex", "imagine", "connect", "seti", "hike"] as const;

const PRESET_KEYS = ACTIVITY_TYPES.flatMap((type) =>
  [1, 2, 3].map((n) => `${type}-${n}`),
);

const ALL_KEYS = [...PRESET_KEYS, ...NAMED_KEYS];

const KEYS = new Set(ALL_KEYS);

const LEGACY_PATHS: Record<string, string> = {
  "/defaults/hackathon.jpg": "hackathon-1",
  "/defaults/workshop.jpg": "workshop-1",
  "/defaults/research.jpg": "research-1",
  "/defaults/software.jpg": "software-1",
  "/defaults/game.jpg": "game-1",
  "/defaults/sports.jpg": "sports-1",
  "/defaults/boardgames.jpg": "boardgames-1",
  "/defaults/other.jpg": "other-1",
  "/activities/imagine.jpg": "imagine",
  "/activities/spacex.jpg": "spacex",
  "/activities/connect.jpg": "connect",
  "/activities/seti.jpg": "seti",
  "/activities/hike.jpg": "hike",
};

const DEFAULT_BUCKET = "cradlink.firebasestorage.app";

function fileName(key: string) {
  return `${key}.jpg`;
}

export function presetsForType(type: ActivityType) {
  return [1, 2, 3].map((n) => `${type}-${n}`);
}

export function isDefaultCoverKey(value: string | null | undefined): value is string {
  return Boolean(value && KEYS.has(value));
}

export function defaultCoverKey(value: string | null | undefined) {
  if (!value) return null;
  if (KEYS.has(value)) return value;
  if (LEGACY_PATHS[value]) return LEGACY_PATHS[value];

  try {
    const parsed = value.startsWith("http") ? new URL(value) : null;
    const fromQuery = parsed?.pathname ?? value;
    const match = decodeURIComponent(fromQuery).match(/\/defaults\/([^/?#]+)$/i);
    const key = match?.[1]?.replace(/\.jpg$/i, "");
    if (key && KEYS.has(key)) return key;
  } catch {
    /* ignore */
  }
  return null;
}

export function localDefaultSrc(key: string) {
  return `/defaults/${fileName(key)}`;
}

export function storageDefaultSrc(key: string) {
  const bucket = appEnv.firebase.storageBucket || DEFAULT_BUCKET;
  const path = `defaults/${fileName(key)}`;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
}

export function defaultCoverSrc(key: string) {
  return storageDefaultSrc(key);
}

export function fallbackCoverSrc(src: string, type?: ActivityType) {
  const key = defaultCoverKey(src) ?? (type ? `${type}-1` : null);
  if (!key) return null;
  const local = localDefaultSrc(key);
  return src === local ? null : local;
}

export function resolveCoverSrc(value: string | null | undefined, type?: ActivityType) {
  const key = defaultCoverKey(value);
  if (key) return storageDefaultSrc(key);
  if (value && /^(https?:|data:|blob:|\/)/i.test(value)) return value;
  if (type) return storageDefaultSrc(`${type}-1`);
  return "";
}

export function persistCoverValue(value: string | null | undefined) {
  const key = defaultCoverKey(value);
  if (key) return key;
  if (!value) return null;
  if (value.startsWith("blob:") || value.startsWith("data:") || value.startsWith("file:")) return null;
  return value;
}
