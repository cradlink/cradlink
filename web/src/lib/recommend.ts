import { isActivityFull } from "@/lib/headcount";
import { isActivityPast } from "@/lib/search";
import type { Activity, User } from "@/lib/types";

export type RecommendContext = {
  user: User;
  tasteActivities: Activity[];
  followedIds: Set<string>;
  followedJoinedIds: Set<string>;
  joinedIds: Set<string>;
  now?: number;
};

export type ScoredActivity = {
  activity: Activity;
  score: number;
  reasons: string[];
};

const DAY = 24 * 60 * 60 * 1000;

function token(value: string) {
  return value.trim().toLowerCase();
}

function overlap(left: string[], right: string[]) {
  const set = new Set(right.map(token).filter(Boolean));
  return left.map(token).filter((item) => item && set.has(item)).length;
}

function cityOf(activity: Activity) {
  return token(activity.location.city || "");
}

function samePlace(userLocation: string, activity: Activity) {
  const home = token(userLocation);
  const city = cityOf(activity);
  if (!home || !city) return false;
  return home === city || home.includes(city) || city.includes(home);
}

export function isRecommendable(activity: Activity, ctx: RecommendContext) {
  if (activity.creatorId === ctx.user.id) return false;
  if (ctx.joinedIds.has(activity.id)) return false;
  if (activity.status === "cancelled" || activity.status === "completed") return false;
  if (isActivityPast(activity)) return false;
  if (isActivityFull(activity)) return false;
  return true;
}

export function scoreActivity(activity: Activity, ctx: RecommendContext): ScoredActivity {
  const reasons: string[] = [];
  let score = 0;
  const taste = ctx.tasteActivities;
  const types = new Set(taste.map((item) => item.type));
  const tags = taste.flatMap((item) => item.tags ?? []);
  const looking = taste.flatMap((item) => item.lookingFor);
  const skills = ctx.user.skills ?? [];

  if (types.has(activity.type)) {
    score += 3;
    reasons.push("Matches what you join");
  }

  const tagHits = overlap(activity.tags ?? [], tags);
  if (tagHits > 0) {
    score += Math.min(2, tagHits);
    reasons.push("Similar tags");
  }

  const skillHits = overlap(activity.lookingFor, skills) + overlap(activity.tags ?? [], skills);
  if (skillHits > 0) {
    score += Math.min(2, skillHits);
    reasons.push("Matches your skills");
  }

  const lookingHits = overlap(activity.lookingFor, looking);
  if (lookingHits > 0) {
    score += 1;
  }

  if (samePlace(ctx.user.location, activity)) {
    score += 2;
    reasons.push(activity.location.city ? `Near ${activity.location.city}` : "Near you");
  }

  const placeTypes = new Set(taste.map((item) => item.location.type));
  if (placeTypes.has(activity.location.type)) {
    score += 1;
  }

  if (ctx.followedIds.has(activity.creatorId)) {
    score += 4;
    reasons.unshift("You follow the organizer");
  }

  if (ctx.followedJoinedIds.has(activity.id)) {
    score += 3;
    reasons.unshift("People you follow are going");
  }

  const now = ctx.now ?? Date.now();
  if (activity.isFlexible || !activity.startAt) {
    score += 0.5;
  } else {
    const start = new Date(activity.startAt).getTime();
    if (!Number.isNaN(start) && start >= now) {
      const until = start - now;
      if (until <= 3 * DAY) {
        score += 3;
        reasons.push("Starting soon");
      } else if (until <= 7 * DAY) {
        score += 2;
        reasons.push("This week");
      } else if (until <= 14 * DAY) {
        score += 1;
      }
    }
  }

  score += Math.min(1, Math.log1p(activity.memberCount) * 0.25);

  return { activity, score, reasons };
}

export function recommendActivities(
  candidates: Activity[],
  ctx: RecommendContext,
  limit = 5,
): ScoredActivity[] {
  return candidates
    .filter((activity) => isRecommendable(activity, ctx))
    .map((activity) => scoreActivity(activity, ctx))
    .filter((row) => row.score >= 1.5)
    .sort((a, b) => b.score - a.score || b.activity.createdAt.localeCompare(a.activity.createdAt))
    .slice(0, limit);
}
