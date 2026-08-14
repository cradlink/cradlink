import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import type { FollowsRepo } from "@/lib/data/types";
import { firebaseUsers } from "@/lib/data/firebase";
import { firebaseNotifications } from "@/lib/data/notifications-firebase";
import { notifyFollowRequest, notifyFollowed } from "@/lib/data/notify";
import { AppError } from "@/lib/errors";
import { getFirebaseDb } from "@/lib/firebase";
import { isPrivateProfile, type Follow, type FollowWithUser } from "@/lib/types";
import { followId, nowIso, stripUndefined } from "@/lib/utils";

function mapFollow(id: string, data: Record<string, unknown>): Follow {
  return {
    id,
    followerId: String(data.followerId ?? ""),
    followeeId: String(data.followeeId ?? ""),
    status: data.status === "pending" ? "pending" : "accepted",
    createdAt: String(data.createdAt ?? nowIso()),
  };
}

export const firebaseFollows: FollowsRepo = {
  async get(followerId, followeeId) {
    const snap = await getDoc(doc(getFirebaseDb(), "follows", followId(followerId, followeeId)));
    return snap.exists() ? mapFollow(snap.id, snap.data() as Record<string, unknown>) : null;
  },

  async listOutgoing(userId) {
    const snap = await getDocs(query(collection(getFirebaseDb(), "follows"), where("followerId", "==", userId)));
    return snap.docs.map((row) => mapFollow(row.id, row.data() as Record<string, unknown>));
  },

  async listIncoming(userId) {
    const snap = await getDocs(query(collection(getFirebaseDb(), "follows"), where("followeeId", "==", userId)));
    return snap.docs.map((row) => mapFollow(row.id, row.data() as Record<string, unknown>));
  },

  async listRequests(userId) {
    const incoming = await firebaseFollows.listIncoming(userId);
    const pending = incoming.filter((row) => row.status === "pending");
    const users = await firebaseUsers.getByIds(pending.map((row) => row.followerId));
    const byId = Object.fromEntries(users.map((user) => [user.id, user]));
    return pending
      .map((row) => (byId[row.followerId] ? ({ ...row, user: byId[row.followerId] } satisfies FollowWithUser) : null))
      .filter((row): row is FollowWithUser => Boolean(row))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async follow(actorId, targetId) {
    if (actorId === targetId) throw new AppError("You can’t follow yourself.");
    const existing = await firebaseFollows.get(actorId, targetId);
    if (existing?.status === "accepted") throw new AppError("You’re already following them.");
    if (existing?.status === "pending") return existing;

    const target = await firebaseUsers.getById(targetId);
    if (!target) throw new AppError("User not found.");
    const actor = await firebaseUsers.getById(actorId);
    if (!actor) throw new AppError("User not found.");

    const status = isPrivateProfile(target) ? "pending" : "accepted";
    const follow: Follow = {
      id: followId(actorId, targetId),
      followerId: actorId,
      followeeId: targetId,
      status,
      createdAt: nowIso(),
    };
    await setDoc(doc(getFirebaseDb(), "follows", follow.id), stripUndefined(follow));
    if (status === "pending") void notifyFollowRequest(firebaseNotifications, actor, targetId);
    else void notifyFollowed(firebaseNotifications, actor, targetId);
    return follow;
  },

  async unfollow(actorId, targetId) {
    const existing = await firebaseFollows.get(actorId, targetId);
    if (!existing) return;
    await deleteDoc(doc(getFirebaseDb(), "follows", existing.id));
    if (existing.status === "pending") {
      await firebaseNotifications.remove(`follow_request_${actorId}`, targetId);
    }
  },

  async accept(actorId, followerId) {
    const existing = await firebaseFollows.get(followerId, actorId);
    if (!existing || existing.status !== "pending") throw new AppError("No request to confirm.");
    await updateDoc(doc(getFirebaseDb(), "follows", existing.id), { status: "accepted" });
    await firebaseNotifications.remove(`follow_request_${followerId}`, actorId);
    return { ...existing, status: "accepted" };
  },

  async decline(actorId, followerId) {
    const existing = await firebaseFollows.get(followerId, actorId);
    if (!existing || existing.status !== "pending") return;
    await deleteDoc(doc(getFirebaseDb(), "follows", existing.id));
    await firebaseNotifications.remove(`follow_request_${followerId}`, actorId);
  },

  async acceptAllPending(userId) {
    const requests = (await firebaseFollows.listIncoming(userId)).filter((row) => row.status === "pending");
    await Promise.all(
      requests.map(async (row) => {
        await updateDoc(doc(getFirebaseDb(), "follows", row.id), { status: "accepted" });
        await firebaseNotifications.remove(`follow_request_${row.followerId}`, userId);
      }),
    );
  },
};
