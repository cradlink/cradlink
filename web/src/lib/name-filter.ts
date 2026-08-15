import { doc, getDoc } from "firebase/firestore";
import { isFirebaseConfigured, getFirebaseDb } from "@/lib/firebase";
import { displayNameKey } from "@/lib/format";

export type NameFilterReason = "tooShort" | "unavailable";

type NameLists = {
  reserved: Set<string>;
  blocked: Set<string>;
};

let lists: NameLists = { reserved: new Set(), blocked: new Set() };
let loadOnce: Promise<void> | null = null;

function asWords(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => fold(String(item)).replace(/[^a-z]+/g, ""))
    .filter(Boolean);
}

function fold(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/@/g, "a");
}

function tokens(value: string) {
  return fold(value)
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function looksBlocked(name: string) {
  const words = tokens(name);
  const compact = words.join("");
  return [...lists.blocked].some((bad) => words.includes(bad) || compact.includes(bad));
}

export async function ensureNameFilter() {
  if (loadOnce) return loadOnce;
  loadOnce = (async () => {
    if (!isFirebaseConfigured()) return;
    try {
      const snap = await getDoc(doc(getFirebaseDb(), "config", "nameFilter"));
      if (!snap.exists()) return;
      const data = snap.data();
      lists = {
        reserved: new Set(asWords(data.reserved)),
        blocked: new Set([...asWords(data.blocked), ...asWords(data.swears)]),
      };
    } catch {
      lists = { reserved: new Set(), blocked: new Set() };
    }
  })();
  return loadOnce;
}

export function handleBlockedReason(handle: string) {
  const compact = displayNameKey(handle);
  if (lists.reserved.has(compact) || tokens(handle).some((word) => lists.reserved.has(word))) {
    return "unavailable" as const;
  }
  if (looksBlocked(handle) || looksBlocked(compact)) return "unavailable" as const;
  return null;
}

export function nameFilterReason(name: string): NameFilterReason | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "tooShort";
  if (looksBlocked(trimmed)) return "unavailable";
  return null;
}

export function sanitizeDisplayName(name: string, fallback: string) {
  const trimmed = name.trim();
  if (!nameFilterReason(trimmed)) return trimmed;
  const safeFallback = fallback.trim();
  if (safeFallback && !nameFilterReason(safeFallback)) return safeFallback;
  return "Member";
}
