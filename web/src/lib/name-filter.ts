import { handleFromName } from "@/lib/format";

const RESERVED = new Set([
  "admin",
  "administrator",
  "cradlink",
  "official",
  "support",
  "moderator",
  "mod",
  "staff",
  "security",
  "system",
  "root",
  "owner",
  "helpdesk",
  "settings",
]);

const BLOCKED = [
  "fuck",
  "shit",
  "cunt",
  "bitch",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "whore",
  "slut",
  "asshole",
  "dick",
  "pussy",
  "cock",
  "bastard",
  "rape",
  "jebi",
  "jebem",
  "picka",
  "picku",
  "kurac",
  "kurcu",
  "sranje",
  "govno",
  "peder",
];

export type NameFilterReason = "tooShort" | "reserved" | "blocked";

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
  return BLOCKED.some((bad) => words.includes(bad) || compact.includes(bad));
}

export function nameFilterReason(name: string): NameFilterReason | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "tooShort";
  const handle = fold(handleFromName(trimmed)).replace(/[^a-z]/g, "");
  if (RESERVED.has(handle) || tokens(trimmed).some((word) => RESERVED.has(word))) return "reserved";
  if (looksBlocked(trimmed) || looksBlocked(handle)) return "blocked";
  return null;
}

export function sanitizeDisplayName(name: string, fallback: string) {
  const trimmed = name.trim();
  if (!nameFilterReason(trimmed)) return trimmed;
  const safeFallback = fallback.trim();
  if (safeFallback && !nameFilterReason(safeFallback)) return safeFallback;
  return "Member";
}
