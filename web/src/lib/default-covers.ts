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
const SHARED_DEFAULTS_PREFIX = "default-activities";
const LEGACY_DEFAULTS_PREFIX = "activities/Z97HyhHyaognvPqhnWpFS2o5F083/defaults";

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
    const match = decodeURIComponent(fromQuery).match(
      /\/(?:default-activities|defaults)\/([^/?#]+)$/i,
    );
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

function storageObjectUrl(path: string) {
  const bucket = appEnv.firebase.storageBucket || DEFAULT_BUCKET;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
}

export function storageDefaultSrc(key: string) {
  return storageObjectUrl(`${SHARED_DEFAULTS_PREFIX}/${fileName(key)}`);
}

export function legacyStorageDefaultSrc(key: string) {
  return storageObjectUrl(`${LEGACY_DEFAULTS_PREFIX}/${fileName(key)}`);
}

export function defaultCoverSrc(key: string) {
  return resolveCoverSrc(key);
}

export function coverSrcs(value: string | null | undefined, type?: ActivityType) {
  const key = defaultCoverKey(value) ?? (!value && type ? `${type}-1` : null);
  const out: string[] = [];
  const push = (src: string | null | undefined) => {
    if (src && !out.includes(src)) out.push(src);
  };

  if (value && value.startsWith("/")) push(value);
  if (key) {
    push(localDefaultSrc(key));
    push(legacyStorageDefaultSrc(key));
    push(storageDefaultSrc(key));
  }
  if (value && /^(https?:|data:|blob:)/i.test(value)) push(value);
  if (!out.length && type) {
    push(legacyStorageDefaultSrc(`${type}-1`));
    push(localDefaultSrc(`${type}-1`));
  }
  return out;
}

export function fallbackCoverSrc(src: string, type?: ActivityType) {
  const next = coverSrcs(src, type);
  const index = next.indexOf(src);
  return next.find((url, i) => i > Math.max(index, -1) && url !== src) ?? null;
}

export function resolveCoverSrc(value: string | null | undefined, type?: ActivityType) {
  return coverSrcs(value, type)[0] ?? "";
}

export function persistCoverValue(value: string | null | undefined) {
  const key = defaultCoverKey(value);
  if (key) return key;
  if (!value) return null;
  if (value.startsWith("blob:") || value.startsWith("data:") || value.startsWith("file:")) return null;
  return value;
}
