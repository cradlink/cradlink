import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { PAGE_SIZE } from "@/lib/config";
import type { ActivitiesRepo, MembersRepo, UsersRepo } from "@/lib/data/types";
import { appError } from "@/lib/errors";
import { assertUsernameAvailable, claimUsername, normalizeUsername } from "@/lib/username";
import { getFirebaseDb } from "@/lib/firebase";
import { firebaseNotifications } from "@/lib/data/notifications-firebase";
import { notifyActivityEdited, notifyDecision, notifyJoin, notifyKicked } from "@/lib/data/notify";
import { defaultHeadcount, hardCap, isActivityFull, statusForCapacity } from "@/lib/headcount";
import type {
  Activity,
  ActivityMember,
  ActivityStatus,
  ActivityType,
  CreateActivityInput,
  Headcount,
  JoinPolicy,
  LocationType,
  MemberWithUser,
  User,
  Visibility,
} from "@/lib/types";
import { createId, memberId, nowIso, stripUndefined } from "@/lib/utils";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function mapUser(id: string, data: DocumentData): User {
  return {
    id,
    displayName: asString(data.displayName, "Member"),
    email: asString(data.email),
    bio: asString(data.bio),
    skills: Array.isArray(data.skills) ? data.skills : [],
    avatarUrl: (data.avatarUrl as string | null) ?? null,
    bannerUrl: (data.bannerUrl as string | null) ?? null,
    location: asString(data.location),
    createdAt: asString(data.createdAt, nowIso()),
    updatedAt: asString(data.updatedAt, nowIso()),
    profileVisibility:
      data.profileVisibility === "private" || data.visibility === "private" ? "private" : "public",
    locale: typeof data.locale === "string" ? data.locale : null,
    deactivatedAt: typeof data.deactivatedAt === "string" ? data.deactivatedAt : null,
    username: typeof data.username === "string" ? data.username : null,
    emailReminders: data.emailReminders === false ? false : true,
  };
}

function mapActivity(id: string, data: DocumentData): Activity {
  const location = (data.location ?? {}) as { type?: LocationType; city?: string; venue?: string };
  return {
    id,
    title: asString(data.title),
    description: asString(data.description),
    type: data.type as ActivityType,
    lookingFor: Array.isArray(data.lookingFor) ? data.lookingFor : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    location: {
      type: location.type ?? "online",
      city: location.city,
      venue: location.venue,
    },
    startAt: (data.startAt as string | null) ?? null,
    endAt: (data.endAt as string | null) ?? null,
    isFlexible: Boolean(data.isFlexible),
    capacity: typeof data.capacity === "number" ? data.capacity : null,
    joinPolicy: (data.joinPolicy as JoinPolicy) || "auto",
    headcount: (data.headcount as Headcount) || defaultHeadcount(typeof data.capacity === "number" ? data.capacity : null),
    creatorId: asString(data.creatorId),
    creatorName: asString(data.creatorName),
    creatorAvatar: (data.creatorAvatar as string | null) ?? null,
    memberCount: typeof data.memberCount === "number" ? data.memberCount : 0,
    status: (data.status as ActivityStatus) ?? "open",
    createdAt: asString(data.createdAt, nowIso()),
    updatedAt: asString(data.updatedAt, nowIso()),
    visibility: (data.visibility as Visibility) ?? "public",
    images: Array.isArray(data.images) ? data.images : [],
  };
}

function mapMember(id: string, data: DocumentData): ActivityMember {
  return {
    id,
    activityId: asString(data.activityId),
    userId: asString(data.userId),
    status: data.status ?? "joined",
    joinedAt: asString(data.joinedAt, nowIso()),
    role: data.role,
  };
}

export const firebaseUsers: UsersRepo = {
  async getById(id) {
    const snap = await getDoc(doc(getFirebaseDb(), "users", id));
    return snap.exists() ? mapUser(snap.id, snap.data()) : null;
  },

  async getByIds(ids) {
    const unique = [...new Set(ids)];
    const users = await Promise.all(unique.map((id) => firebaseUsers.getById(id)));
    return users.filter((u): u is User => Boolean(u));
  },

  async list(max = 200) {
    const snap = await getDocs(query(collection(getFirebaseDb(), "users"), limit(max)));
    return snap.docs
      .map((row) => mapUser(row.id, row.data()))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },

  async upsert(user) {
    await setDoc(doc(getFirebaseDb(), "users", user.id), stripUndefined(user), { merge: true });
    return user;
  },

  async update(id, patch) {
    const ref = doc(getFirebaseDb(), "users", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw appError("errors.userNotFound");
    if (patch.username !== undefined) {
      const current = typeof snap.data().username === "string" ? snap.data().username : "";
      const nextHandle = normalizeUsername(patch.username);
      if (nextHandle !== current) {
        await assertUsernameAvailable(patch.username, id);
        await claimUsername(id, patch.username);
      }
      patch = { ...patch, username: nextHandle };
    }
    const next = mapUser(id, { ...snap.data(), ...patch, updatedAt: nowIso() });
    await updateDoc(ref, stripUndefined({ ...patch, updatedAt: nowIso() }));

    const created = await getDocs(
      query(collection(getFirebaseDb(), "activities"), where("creatorId", "==", id)),
    );
    await Promise.all(
      created.docs.map((row) =>
        updateDoc(row.ref, {
          creatorName: next.displayName,
          creatorAvatar: next.avatarUrl,
          updatedAt: nowIso(),
        }),
      ),
    );
    return next;
  },
};

function byNewest(a: Activity, b: Activity) {
  return b.createdAt.localeCompare(a.createdAt);
}

export const firebaseActivities: ActivitiesRepo = {
  async list(filters) {
    const pageSize = filters.limit ?? PAGE_SIZE;
    const snap = await getDocs(
      query(collection(getFirebaseDb(), "activities"), where("visibility", "==", "public"), limit(100)),
    );
    let items = snap.docs
      .map((row) => mapActivity(row.id, row.data()))
      .filter((a) => a.status !== "cancelled")
      .sort(byNewest);

    if (filters.type && filters.type !== "all") {
      items = items.filter((a) => a.type === filters.type);
    }
    if (filters.locationType && filters.locationType !== "all") {
      items = items.filter((a) => a.location.type === filters.locationType);
    }

    const start = filters.cursor ? items.findIndex((a) => a.id === filters.cursor) + 1 : 0;
    const page = items.slice(Math.max(0, start), Math.max(0, start) + pageSize);
    const nextCursor = start + pageSize < items.length ? page[page.length - 1]?.id ?? null : null;
    return { items: page, nextCursor };
  },

  async getById(id) {
    const snap = await getDoc(doc(getFirebaseDb(), "activities", id));
    return snap.exists() ? mapActivity(snap.id, snap.data()) : null;
  },

  async create(creator, input: CreateActivityInput) {
    const id = createId("act");
    const timestamp = nowIso();
    const activity: Activity = {
      id,
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      lookingFor: [],
      tags: [],
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

    if (activity.images.some((src) => src.startsWith("data:") || src.startsWith("blob:"))) {
      throw appError("errors.photosTooLarge");
    }

    const db = getFirebaseDb();
    await setDoc(doc(db, "activities", id), stripUndefined(activity));
    const mid = memberId(id, creator.id);
    await setDoc(
      doc(db, "activityMembers", mid),
      stripUndefined({
        id: mid,
        activityId: id,
        userId: creator.id,
        status: "joined",
        joinedAt: timestamp,
        role: "organizer",
      }),
    );
    return activity;
  },

  async update(id, actorId, input) {
    const existing = await firebaseActivities.getById(id);
    if (!existing) throw appError("errors.activityNotFound");
    if (existing.creatorId !== actorId) throw appError("errors.onlyOrganizerEdit");
    if ((input.images ?? []).some((src) => src.startsWith("data:") || src.startsWith("blob:"))) {
      throw appError("errors.photosTooLarge");
    }

    const next = {
      ...existing,
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      lookingFor: [],
      tags: [],
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

    await updateDoc(
      doc(getFirebaseDb(), "activities", id),
      stripUndefined({
        title: next.title,
        description: next.description,
        type: next.type,
        lookingFor: next.lookingFor,
        tags: next.tags,
        location: next.location,
        startAt: next.startAt,
        endAt: next.endAt,
        isFlexible: next.isFlexible,
        capacity: next.capacity,
        joinPolicy: next.joinPolicy,
        headcount: next.headcount,
        visibility: next.visibility,
        images: next.images,
        status: next.status,
        updatedAt: next.updatedAt,
      }),
    );
    const members = await getDocs(
      query(collection(getFirebaseDb(), "activityMembers"), where("activityId", "==", id)),
    );
    const joinedIds = members.docs
      .filter((row) => row.data().status === "joined")
      .map((row) => String(row.data().userId ?? ""));
    void notifyActivityEdited(
      firebaseNotifications,
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

  async remove(id, actorId) {
    const existing = await firebaseActivities.getById(id);
    if (!existing) throw appError("errors.activityNotFound");
    if (existing.creatorId !== actorId) throw appError("errors.onlyOrganizerDelete");

    const db = getFirebaseDb();
    const members = await getDocs(
      query(collection(db, "activityMembers"), where("activityId", "==", id)),
    );
    await Promise.all(members.docs.map((row) => deleteDoc(row.ref)));
    await deleteDoc(doc(db, "activities", id));
  },

  async listCreatedBy(userId) {
    const snap = await getDocs(
      query(collection(getFirebaseDb(), "activities"), where("creatorId", "==", userId)),
    );
    return snap.docs.map((row) => mapActivity(row.id, row.data())).sort(byNewest);
  },

  async listJoinedBy(userId) {
    const memberships = await getDocs(
      query(collection(getFirebaseDb(), "activityMembers"), where("userId", "==", userId)),
    );
    const ids = memberships.docs
      .filter((row) => row.data().status === "joined")
      .map((row) => asString(row.data().activityId));
    const activities = await Promise.all(ids.map((id) => firebaseActivities.getById(id)));
    return activities
      .filter((a): a is Activity => Boolean(a))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};

export const firebaseMembers: MembersRepo = {
  async listByActivity(activityId) {
    const snap = await getDocs(
      query(
        collection(getFirebaseDb(), "activityMembers"),
        where("activityId", "==", activityId),
      ),
    );
    const members = snap.docs
      .map((row) => mapMember(row.id, row.data()))
      .filter((m) => m.status === "joined" || m.status === "pending");
    const users = await firebaseUsers.getByIds(members.map((m) => m.userId));
    const byId = Object.fromEntries(users.map((u) => [u.id, u]));
    return members
      .map((m) => (byId[m.userId] ? ({ ...m, user: byId[m.userId] } satisfies MemberWithUser) : null))
      .filter((m): m is MemberWithUser => Boolean(m))
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  },

  async getMembership(activityId, userId) {
    const snap = await getDoc(doc(getFirebaseDb(), "activityMembers", memberId(activityId, userId)));
    if (!snap.exists()) return null;
    const member = mapMember(snap.id, snap.data());
    if (member.status !== "joined" && member.status !== "pending") return null;
    const user = await firebaseUsers.getById(userId);
    return user ? { ...member, user } : null;
  },

  async join(activityId, userId) {
    const db = getFirebaseDb();
    return runTransaction(db, async (tx) => {
      const actRef = doc(db, "activities", activityId);
      const memRef = doc(db, "activityMembers", memberId(activityId, userId));
      const actSnap = await tx.get(actRef);
      if (!actSnap.exists()) throw appError("errors.activityNotFound");
      const activity = mapActivity(actSnap.id, actSnap.data());
      if (activity.status === "cancelled") throw appError("errors.cancelled");
      if (activity.status === "completed") throw appError("errors.ended");
      const memSnap = await tx.get(memRef);
      if (memSnap.exists() && memSnap.data().status === "joined") {
        throw appError("errors.alreadyIn");
      }
      if (memSnap.exists() && memSnap.data().status === "pending") {
        throw appError("errors.requestAlreadySent");
      }
      if (isActivityFull(activity)) throw appError("errors.activityFull");
      const timestamp = nowIso();
      const auto = (activity.joinPolicy ?? "auto") === "auto";
      tx.set(memRef, {
        id: memRef.id,
        activityId,
        userId,
        status: auto ? "joined" : "pending",
        joinedAt: timestamp,
      });
      if (!auto) {
        tx.update(actRef, { updatedAt: timestamp });
        return { ...activity, updatedAt: timestamp };
      }
      const memberCount = activity.memberCount + 1;
      const cap = hardCap(activity);
      const status = cap != null && memberCount >= cap ? "full" : activity.status;
      tx.update(actRef, { memberCount, status, updatedAt: timestamp });
      return { ...activity, memberCount, status, updatedAt: timestamp };
    }).then(async (activity) => {
      try {
        const actor = await firebaseUsers.getById(userId);
        if (actor) await notifyJoin(firebaseNotifications, activity, actor);
      } catch {
        // Join already succeeded; organizer just won’t get a ping this time.
      }
      return activity;
    });
  },

  async leave(activityId, userId) {
    const db = getFirebaseDb();
    return runTransaction(db, async (tx) => {
      const actRef = doc(db, "activities", activityId);
      const memRef = doc(db, "activityMembers", memberId(activityId, userId));
      const actSnap = await tx.get(actRef);
      if (!actSnap.exists()) throw appError("errors.activityNotFound");
      const activity = mapActivity(actSnap.id, actSnap.data());
      if (activity.creatorId === userId) {
        throw appError("errors.organizerCantLeave");
      }
      const memSnap = await tx.get(memRef);
      if (!memSnap.exists() || (memSnap.data().status !== "joined" && memSnap.data().status !== "pending")) {
        throw appError("errors.notInThisOne");
      }
      const timestamp = nowIso();
      const wasJoined = memSnap.data().status === "joined";
      tx.delete(memRef);
      if (!wasJoined) {
        tx.update(actRef, { updatedAt: timestamp });
        return { ...activity, updatedAt: timestamp };
      }
      const memberCount = Math.max(1, activity.memberCount - 1);
      const status = activity.status === "full" ? "open" : activity.status;
      tx.update(actRef, { memberCount, status, updatedAt: timestamp });
      return { ...activity, memberCount, status, updatedAt: timestamp };
    });
  },

  async kick(activityId, userId, actorId) {
    const db = getFirebaseDb();
    return runTransaction(db, async (tx) => {
      const actRef = doc(db, "activities", activityId);
      const memRef = doc(db, "activityMembers", memberId(activityId, userId));
      const actSnap = await tx.get(actRef);
      if (!actSnap.exists()) throw appError("errors.activityNotFound");
      const activity = mapActivity(actSnap.id, actSnap.data());
      if (activity.creatorId !== actorId) throw appError("errors.onlyOrganizerRemove");
      if (activity.creatorId === userId) throw appError("errors.cantRemoveSelf");
      const memSnap = await tx.get(memRef);
      if (!memSnap.exists() || (memSnap.data().status !== "joined" && memSnap.data().status !== "pending")) {
        throw appError("errors.theyArentIn");
      }
      const timestamp = nowIso();
      const wasJoined = memSnap.data().status === "joined";
      tx.delete(memRef);
      if (!wasJoined) {
        tx.update(actRef, { updatedAt: timestamp });
        return { ...activity, updatedAt: timestamp };
      }
      const memberCount = Math.max(1, activity.memberCount - 1);
      const status = activity.status === "full" ? "open" : activity.status;
      tx.update(actRef, { memberCount, status, updatedAt: timestamp });
      return { ...activity, memberCount, status, updatedAt: timestamp };
    }).then(async (activity) => {
      void notifyKicked(firebaseNotifications, activity, userId);
      return activity;
    });
  },

  async accept(activityId, userId, actorId) {
    const db = getFirebaseDb();
    return runTransaction(db, async (tx) => {
      const actRef = doc(db, "activities", activityId);
      const memRef = doc(db, "activityMembers", memberId(activityId, userId));
      const actSnap = await tx.get(actRef);
      if (!actSnap.exists()) throw appError("errors.activityNotFound");
      const activity = mapActivity(actSnap.id, actSnap.data());
      if (activity.creatorId !== actorId) throw appError("errors.onlyOrganizerAccept");
      if (isActivityFull(activity)) throw appError("errors.activityFull");
      const memSnap = await tx.get(memRef);
      if (!memSnap.exists() || memSnap.data().status !== "pending") {
        throw appError("errors.noRequestAccept");
      }
      const timestamp = nowIso();
      const memberCount = activity.memberCount + 1;
      const cap = hardCap(activity);
      const status = cap != null && memberCount >= cap ? "full" : activity.status;
      tx.update(memRef, { status: "joined" });
      tx.update(actRef, { memberCount, status, updatedAt: timestamp });
      return { ...activity, memberCount, status, updatedAt: timestamp };
    }).then(async (activity) => {
      void notifyDecision(firebaseNotifications, activity, userId, "accepted");
      return activity;
    });
  },

  async decline(activityId, userId, actorId) {
    const db = getFirebaseDb();
    return runTransaction(db, async (tx) => {
      const actRef = doc(db, "activities", activityId);
      const memRef = doc(db, "activityMembers", memberId(activityId, userId));
      const actSnap = await tx.get(actRef);
      if (!actSnap.exists()) throw appError("errors.activityNotFound");
      const activity = mapActivity(actSnap.id, actSnap.data());
      if (activity.creatorId !== actorId) throw appError("errors.onlyOrganizerDecline");
      const memSnap = await tx.get(memRef);
      if (!memSnap.exists() || memSnap.data().status !== "pending") {
        throw appError("errors.noRequestDecline");
      }
      const timestamp = nowIso();
      tx.delete(memRef);
      tx.update(actRef, { updatedAt: timestamp });
      return { ...activity, updatedAt: timestamp };
    }).then(async (activity) => {
      void notifyDecision(firebaseNotifications, activity, userId, "declined");
      return activity;
    });
  },
};
