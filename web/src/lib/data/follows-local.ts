import type { FollowsRepo } from "@/lib/data/types";
import { localUsers } from "@/lib/data/local";
import { localNotifications } from "@/lib/data/notifications-local";
import { notifyFollowRequest, notifyFollowed } from "@/lib/data/notify";
import { appError } from "@/lib/errors";
import { isPrivateProfile, type Follow, type FollowWithUser } from "@/lib/types";
import { followId, nowIso } from "@/lib/utils";

const KEY = "cl_follows";

function load(): Record<string, Follow> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, Follow>;
  } catch {
    return {};
  }
}

function save(rows: Record<string, Follow>) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export const localFollows: FollowsRepo = {
  async get(followerId, followeeId) {
    return load()[followId(followerId, followeeId)] ?? null;
  },

  async listOutgoing(userId) {
    return Object.values(load()).filter((row) => row.followerId === userId);
  },

  async listIncoming(userId) {
    return Object.values(load()).filter((row) => row.followeeId === userId);
  },

  async listRequests(userId) {
    const pending = (await localFollows.listIncoming(userId)).filter((row) => row.status === "pending");
    const users = await localUsers.getByIds(pending.map((row) => row.followerId));
    const byId = Object.fromEntries(users.map((user) => [user.id, user]));
    return pending
      .map((row) => (byId[row.followerId] ? ({ ...row, user: byId[row.followerId] } satisfies FollowWithUser) : null))
      .filter((row): row is FollowWithUser => Boolean(row))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async follow(actorId, targetId) {
    if (actorId === targetId) throw appError("errors.cantFollowSelf");
    const rows = load();
    const id = followId(actorId, targetId);
    if (rows[id]?.status === "accepted") throw appError("errors.alreadyFollowing");
    if (rows[id]?.status === "pending") return rows[id];

    const target = await localUsers.getById(targetId);
    if (!target) throw appError("errors.userNotFound");
    const actor = await localUsers.getById(actorId);
    if (!actor) throw appError("errors.userNotFound");

    const follow: Follow = {
      id,
      followerId: actorId,
      followeeId: targetId,
      status: isPrivateProfile(target) ? "pending" : "accepted",
      createdAt: nowIso(),
    };
    rows[id] = follow;
    save(rows);
    if (follow.status === "pending") void notifyFollowRequest(localNotifications, actor, targetId);
    else void notifyFollowed(localNotifications, actor, targetId);
    return follow;
  },

  async unfollow(actorId, targetId) {
    const rows = load();
    const id = followId(actorId, targetId);
    const existing = rows[id];
    if (!existing) return;
    delete rows[id];
    save(rows);
    if (existing.status === "pending") {
      await localNotifications.remove(`follow_request_${actorId}`, targetId);
    }
  },

  async accept(actorId, followerId) {
    const rows = load();
    const id = followId(followerId, actorId);
    const existing = rows[id];
    if (!existing || existing.status !== "pending") throw appError("errors.noRequestConfirm");
    rows[id] = { ...existing, status: "accepted" };
    save(rows);
    await localNotifications.remove(`follow_request_${followerId}`, actorId);
    return rows[id];
  },

  async decline(actorId, followerId) {
    const rows = load();
    const id = followId(followerId, actorId);
    const existing = rows[id];
    if (!existing || existing.status !== "pending") return;
    delete rows[id];
    save(rows);
    await localNotifications.remove(`follow_request_${followerId}`, actorId);
  },

  async acceptAllPending(userId) {
    const rows = load();
    for (const row of Object.values(rows)) {
      if (row.followeeId === userId && row.status === "pending") {
        rows[row.id] = { ...row, status: "accepted" };
        await localNotifications.remove(`follow_request_${row.followerId}`, userId);
      }
    }
    save(rows);
  },
};
