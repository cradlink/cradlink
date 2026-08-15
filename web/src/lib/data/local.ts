import { PAGE_SIZE } from "@/lib/config";
import { ensureSeed } from "@/lib/data/seed";
import { loadDb, publicUser, saveDb } from "@/lib/data/store";
import type { ActivitiesRepo, MembersRepo, UsersRepo } from "@/lib/data/types";
import { assertDisplayNameAvailable } from "@/lib/display-name";
import { displayNameKey } from "@/lib/format";
import { appError } from "@/lib/errors";
import type {
  Activity,
  ActivityMember,
  CreateActivityInput,
  MemberWithUser,
  User,
} from "@/lib/types";
import { localNotifications } from "@/lib/data/notifications-local";
import { notifyActivityEdited, notifyDecision, notifyJoin, notifyKicked } from "@/lib/data/notify";
import { defaultHeadcount, hardCap, isActivityFull, statusForCapacity } from "@/lib/headcount";
import { createId, memberId, nowIso } from "@/lib/utils";

function withUser(member: ActivityMember, user: User | undefined): MemberWithUser | null {
  if (!user) return null;
  return { ...member, user };
}

export const localUsers: UsersRepo = {
  async getById(id) {
    await ensureSeed();
    const stored = loadDb().users[id];
    return stored ? publicUser(stored) : null;
  },

  async getByIds(ids) {
    await ensureSeed();
    const { users } = loadDb();
    return ids.map((id) => users[id]).filter(Boolean).map(publicUser);
  },

  async list(max = 200) {
    await ensureSeed();
    return Object.values(loadDb().users)
      .map(publicUser)
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .slice(0, max);
  },

  async upsert(user) {
    await ensureSeed();
    const db = loadDb();
    const existing = db.users[user.id];
    db.users[user.id] = { ...existing, ...user, passwordHash: existing?.passwordHash };
    saveDb(db);
    return publicUser(db.users[user.id]);
  },

  async update(id, patch) {
    await ensureSeed();
    const db = loadDb();
    const existing = db.users[id];
    if (!existing) throw appError("errors.userNotFound");
    if (
      patch.displayName !== undefined &&
      displayNameKey(patch.displayName) !== displayNameKey(existing.displayName)
    ) {
      await assertDisplayNameAvailable(patch.displayName, id);
    }
    const next = {
      ...existing,
      ...patch,
      updatedAt: nowIso(),
    };
    db.users[id] = next;
    for (const activity of Object.values(db.activities)) {
      if (activity.creatorId === id) {
        activity.creatorName = next.displayName;
        activity.creatorAvatar = next.avatarUrl;
        activity.updatedAt = next.updatedAt;
      }
    }
    saveDb(db);
    return publicUser(next);
  },
};

export const localActivities: ActivitiesRepo = {
  async list(filters) {
    await ensureSeed();
    const limit = filters.limit ?? PAGE_SIZE;
    let items = Object.values(loadDb().activities)
      .filter((a) => a.visibility === "public" && a.status !== "cancelled")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (filters.type && filters.type !== "all") {
      items = items.filter((a) => a.type === filters.type);
    }
    if (filters.locationType && filters.locationType !== "all") {
      items = items.filter((a) => a.location.type === filters.locationType);
    }

    let start = 0;
    if (filters.cursor) {
      const idx = items.findIndex((a) => a.id === filters.cursor);
      start = idx >= 0 ? idx + 1 : 0;
    }
    const page = items.slice(start, start + limit);
    const nextCursor = start + limit < items.length ? page[page.length - 1]?.id ?? null : null;
    return { items: page, nextCursor };
  },

  async getById(id) {
    await ensureSeed();
    return loadDb().activities[id] ?? null;
  },

  async create(creator: User, input: CreateActivityInput) {
    await ensureSeed();
    const db = loadDb();
    const timestamp = nowIso();
    const activity: Activity = {
      id: createId("act"),
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      lookingFor: input.lookingFor.map((s) => s.trim()).filter(Boolean),
      tags: (input.tags ?? []).map((s) => s.trim()).filter(Boolean),
      location: input.location,
      startAt: input.isFlexible ? null : input.startAt,
      endAt: input.isFlexible ? null : input.endAt,
      isFlexible: input.isFlexible,
      capacity: input.capacity,
      joinPolicy: input.joinPolicy ?? "auto",
      headcount: input.headcount ?? defaultHeadcount(input.capacity),
      creatorId: creator.id,
      creatorName: creator.displayName,
      creatorAvatar: creator.avatarUrl,
      memberCount: 1,
      status: input.capacity === 1 ? "full" : "open",
      createdAt: timestamp,
      updatedAt: timestamp,
      visibility: input.visibility ?? "public",
      images: input.images ?? [],
    };
    db.activities[activity.id] = activity;
    const mid = memberId(activity.id, creator.id);
    db.members[mid] = {
      id: mid,
      activityId: activity.id,
      userId: creator.id,
      status: "joined",
      joinedAt: timestamp,
      role: "organizer",
    };
    saveDb(db);
    return activity;
  },

  async update(id, actorId, input) {
    await ensureSeed();
    const db = loadDb();
    const existing = db.activities[id];
    if (!existing) throw appError("errors.activityNotFound");
    if (existing.creatorId !== actorId) throw appError("errors.onlyOrganizerEdit");
    const next = {
      ...existing,
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      lookingFor: input.lookingFor.map((s) => s.trim()).filter(Boolean),
      tags: (input.tags ?? []).map((s) => s.trim()).filter(Boolean),
      location: input.location,
      startAt: input.isFlexible ? null : input.startAt,
      endAt: input.isFlexible ? null : input.endAt,
      isFlexible: input.isFlexible,
      capacity: input.capacity,
      joinPolicy: input.joinPolicy ?? existing.joinPolicy,
      headcount: input.headcount ?? defaultHeadcount(input.capacity),
      visibility: input.visibility ?? existing.visibility,
      images: input.images ?? existing.images,
      status: statusForCapacity(existing, input.capacity),
      updatedAt: nowIso(),
    };
    db.activities[id] = next;
    saveDb(db);
    const joinedIds = Object.values(db.members)
      .filter((member) => member.activityId === id && member.status === "joined")
      .map((member) => member.userId);
    void notifyActivityEdited(
      localNotifications,
      next,
      {
        id: actorId,
        displayName: next.creatorName,
        avatarUrl: next.creatorAvatar,
      },
      joinedIds,
    );
    return next;
  },

  async listCreatedBy(userId) {
    await ensureSeed();
    return Object.values(loadDb().activities)
      .filter((a) => a.creatorId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listJoinedBy(userId) {
    await ensureSeed();
    const db = loadDb();
    const joinedIds = Object.values(db.members)
      .filter((m) => m.userId === userId && m.status === "joined")
      .map((m) => m.activityId);
    return joinedIds
      .map((id) => db.activities[id])
      .filter(Boolean)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};

export const localMembers: MembersRepo = {
  async listByActivity(activityId) {
    await ensureSeed();
    const db = loadDb();
    return Object.values(db.members)
      .filter((m) => m.activityId === activityId && (m.status === "joined" || m.status === "pending"))
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
      .map((m) => withUser(m, db.users[m.userId] ? publicUser(db.users[m.userId]) : undefined))
      .filter((m): m is MemberWithUser => Boolean(m));
  },

  async getMembership(activityId, userId) {
    await ensureSeed();
    const db = loadDb();
    const row = db.members[memberId(activityId, userId)];
    if (!row || (row.status !== "joined" && row.status !== "pending")) return null;
    const user = db.users[userId];
    return withUser(row, user ? publicUser(user) : undefined);
  },

  async join(activityId, userId) {
    await ensureSeed();
    const db = loadDb();
    const activity = db.activities[activityId];
    if (!activity) throw appError("errors.activityNotFound");
    if (activity.status === "cancelled") throw appError("errors.cancelled");
    if (activity.status === "completed") throw appError("errors.ended");
    const mid = memberId(activityId, userId);
    if (db.members[mid]?.status === "joined") throw appError("errors.alreadyIn");
    if (db.members[mid]?.status === "pending") throw appError("errors.requestAlreadySent");
    if (isActivityFull(activity)) {
      activity.status = "full";
      saveDb(db);
      throw appError("errors.activityFull");
    }
    const timestamp = nowIso();
    const auto = (activity.joinPolicy ?? "auto") === "auto";
    db.members[mid] = {
      id: mid,
      activityId,
      userId,
      status: auto ? "joined" : "pending",
      joinedAt: timestamp,
    };
    if (auto) {
      activity.memberCount += 1;
      const cap = hardCap(activity);
      if (cap != null && activity.memberCount >= cap) activity.status = "full";
    }
    activity.updatedAt = timestamp;
    saveDb(db);
    const actor = db.users[userId];
    if (actor) void notifyJoin(localNotifications, activity, publicUser(actor));
    return activity;
  },

  async leave(activityId, userId) {
    await ensureSeed();
    const db = loadDb();
    const activity = db.activities[activityId];
    if (!activity) throw appError("errors.activityNotFound");
    if (activity.creatorId === userId) {
      throw appError("errors.organizerCantLeave");
    }
    const mid = memberId(activityId, userId);
    const existing = db.members[mid];
    if (!existing || (existing.status !== "joined" && existing.status !== "pending")) {
      throw appError("errors.notInThisOne");
    }
    const wasJoined = existing.status === "joined";
    delete db.members[mid];
    if (wasJoined) {
      activity.memberCount = Math.max(1, activity.memberCount - 1);
      if (activity.status === "full") activity.status = "open";
    }
    activity.updatedAt = nowIso();
    saveDb(db);
    return activity;
  },

  async kick(activityId, userId, actorId) {
    await ensureSeed();
    const db = loadDb();
    const activity = db.activities[activityId];
    if (!activity) throw appError("errors.activityNotFound");
    if (activity.creatorId !== actorId) throw appError("errors.onlyOrganizerRemove");
    if (activity.creatorId === userId) throw appError("errors.cantRemoveSelf");
    const mid = memberId(activityId, userId);
    const existing = db.members[mid];
    if (!existing || (existing.status !== "joined" && existing.status !== "pending")) {
      throw appError("errors.theyArentIn");
    }
    const wasJoined = existing.status === "joined";
    delete db.members[mid];
    if (wasJoined) {
      activity.memberCount = Math.max(1, activity.memberCount - 1);
      if (activity.status === "full") activity.status = "open";
    }
    activity.updatedAt = nowIso();
    saveDb(db);
    void notifyKicked(localNotifications, activity, userId);
    return activity;
  },

  async accept(activityId, userId, actorId) {
    await ensureSeed();
    const db = loadDb();
    const activity = db.activities[activityId];
    if (!activity) throw appError("errors.activityNotFound");
    if (activity.creatorId !== actorId) throw appError("errors.onlyOrganizerAccept");
    if (isActivityFull(activity)) throw appError("errors.activityFull");
    const mid = memberId(activityId, userId);
    const existing = db.members[mid];
    if (!existing || existing.status !== "pending") throw appError("errors.noRequestAccept");
    existing.status = "joined";
    activity.memberCount += 1;
    const cap = hardCap(activity);
    if (cap != null && activity.memberCount >= cap) activity.status = "full";
    activity.updatedAt = nowIso();
    saveDb(db);
    void notifyDecision(localNotifications, activity, userId, "accepted");
    return activity;
  },

  async decline(activityId, userId, actorId) {
    await ensureSeed();
    const db = loadDb();
    const activity = db.activities[activityId];
    if (!activity) throw appError("errors.activityNotFound");
    if (activity.creatorId !== actorId) throw appError("errors.onlyOrganizerDecline");
    const mid = memberId(activityId, userId);
    const existing = db.members[mid];
    if (!existing || existing.status !== "pending") throw appError("errors.noRequestDecline");
    delete db.members[mid];
    activity.updatedAt = nowIso();
    saveDb(db);
    void notifyDecision(localNotifications, activity, userId, "declined");
    return activity;
  },
};
