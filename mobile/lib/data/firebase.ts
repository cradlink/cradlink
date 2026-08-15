import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore"

import type { ActivitiesRepo, MembersRepo, UsersRepo } from "@/lib/data/types"
import { AppError } from "@/lib/errors"
import { getFirebaseDb } from "@/lib/firebase"
import { defaultHeadcount, hardCap, isActivityFull } from "@/lib/headcount"
import { canRemoveActivity } from "@/lib/schedule"
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
  UpdateActivityInput,
  User,
  Visibility,
} from "@/lib/types"
import { asString, asTime, createId, firstImage, memberId, nowIso, stripUndefined } from "@/lib/utils"

const PAGE_SIZE = 80

function mapUser(id: string, data: DocumentData): User {
  return {
    id,
    displayName: asString(data.displayName, "Member"),
    email: asString(data.email),
    username: asString(data.username) || null,
    bio: asString(data.bio),
    skills: Array.isArray(data.skills) ? data.skills : [],
    avatarUrl: (data.avatarUrl as string | null) ?? null,
    bannerUrl: (data.bannerUrl as string | null) ?? null,
    location: asString(data.location),
    visibility: data.profileVisibility === "private" || data.visibility === "private" ? "private" : "public",
    deactivatedAt: asString(data.deactivatedAt) || null,
    createdAt: asTime(data.createdAt),
    updatedAt: asTime(data.updatedAt),
  }
}

function mapActivity(id: string, data: DocumentData): Activity {
  const location = (data.location ?? {}) as { type?: LocationType; city?: string; venue?: string }
  const images = Array.isArray(data.images) ? (data.images as string[]) : []
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
    headcount:
      (data.headcount as Headcount) ||
      defaultHeadcount(typeof data.capacity === "number" ? data.capacity : null),
    creatorId: asString(data.creatorId),
    creatorName: asString(data.creatorName),
    creatorAvatar: (data.creatorAvatar as string | null) ?? null,
    memberCount: typeof data.memberCount === "number" ? data.memberCount : 0,
    status: (data.status as ActivityStatus) ?? "open",
    createdAt: asTime(data.createdAt),
    updatedAt: asTime(data.updatedAt),
    visibility: (data.visibility as Visibility) ?? "public",
    images: firstImage(images),
  }
}

function mapMember(id: string, data: DocumentData): ActivityMember {
  return {
    id,
    activityId: asString(data.activityId),
    userId: asString(data.userId),
    status: data.status ?? "joined",
    joinedAt: asTime(data.joinedAt),
    role: data.role,
  }
}

export const firebaseUsers: UsersRepo = {
  async getById(id) {
    const snap = await getDoc(doc(getFirebaseDb(), "users", id))
    return snap.exists() ? mapUser(snap.id, snap.data()) : null
  },

  async getByIds(ids) {
    const unique = [...new Set(ids)]
    const users = await Promise.all(unique.map((id) => firebaseUsers.getById(id)))
    return users.filter((u): u is User => Boolean(u))
  },

  async list() {
    const snap = await getDocs(collection(getFirebaseDb(), "users"))
    return snap.docs.map((row) => mapUser(row.id, row.data()))
  },
}

async function queryActivities(constraints: QueryConstraint[]) {
  return getDocs(query(collection(getFirebaseDb(), "activities"), ...constraints))
}

async function firstWorkingQuery(attempts: QueryConstraint[][]) {
  let lastError: unknown
  for (const constraints of attempts) {
    try {
      return await queryActivities(constraints)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

export const firebaseActivities: ActivitiesRepo = {
  async list(filters = {}) {
    const pageSize = filters.limit ?? PAGE_SIZE
    const publicOnly: QueryConstraint[] = [where("visibility", "==", "public")]
    if (filters.type && filters.type !== "all") publicOnly.push(where("type", "==", filters.type))

    const ordered = [...publicOnly, orderBy("createdAt", "desc")]
    if (filters.cursor) {
      const cursorSnap = await getDoc(doc(getFirebaseDb(), "activities", filters.cursor))
      if (cursorSnap.exists()) ordered.push(startAfter(cursorSnap))
    }

    const snap = await firstWorkingQuery([
      [...ordered, limit(pageSize + 4)],
      [...publicOnly, limit(pageSize + 4)],
    ])
    let items = snap.docs.map((row) => mapActivity(row.id, row.data())).filter((a) => a.status !== "cancelled")
    if (filters.locationType && filters.locationType !== "all") {
      items = items.filter((a) => a.location.type === filters.locationType)
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const page = items.slice(0, pageSize)
    const nextCursor = items.length > pageSize ? page[page.length - 1]?.id ?? null : null
    return { items: page, nextCursor }
  },

  async getById(id) {
    try {
      const snap = await getDoc(doc(getFirebaseDb(), "activities", id))
      return snap.exists() ? mapActivity(snap.id, snap.data()) : null
    } catch {
      return null
    }
  },

  async create(creator, input: CreateActivityInput) {
    const id = createId("act")
    const timestamp = nowIso()
    const activity: Activity = {
      id,
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
      images: firstImage(input.images),
    }
    const db = getFirebaseDb()
    await setDoc(doc(db, "activities", id), stripUndefined(activity))
    const mid = memberId(id, creator.id)
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
    )
    return activity
  },

  async update(id, actorId, input: UpdateActivityInput) {
    const existing = await firebaseActivities.getById(id)
    if (!existing) throw new AppError("activityNotFound")
    if (existing.creatorId !== actorId) throw new AppError("onlyOrganizer")
    const next: Activity = {
      ...existing,
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      lookingFor: input.lookingFor,
      tags: input.tags ?? existing.tags,
      location: input.location,
      startAt: input.startAt,
      endAt: input.endAt,
      isFlexible: input.isFlexible,
      capacity: input.capacity,
      joinPolicy: input.joinPolicy ?? existing.joinPolicy,
      headcount: input.headcount ?? existing.headcount,
      visibility: input.visibility ?? existing.visibility,
      images: firstImage(input.images ?? existing.images),
      updatedAt: nowIso(),
    }
    await updateDoc(doc(getFirebaseDb(), "activities", id), stripUndefined(next))
    return next
  },

  async remove(id, actorId) {
    const existing = await firebaseActivities.getById(id)
    if (!existing) throw new AppError("activityNotFound")
    if (existing.creatorId !== actorId) throw new AppError("onlyOrganizer")
    if (!canRemoveActivity(existing)) throw new AppError("tooLateToRemove")
    const members = await getDocs(
      query(collection(getFirebaseDb(), "activityMembers"), where("activityId", "==", id)),
    )
    await Promise.all(members.docs.map((row) => deleteDoc(row.ref)))
    await deleteDoc(doc(getFirebaseDb(), "activities", id))
  },

  async listCreatedBy(userId) {
    try {
      const snap = await firstWorkingQuery([
        [where("creatorId", "==", userId), orderBy("createdAt", "desc")],
        [where("creatorId", "==", userId)],
        [where("visibility", "==", "public"), where("creatorId", "==", userId)],
        [where("visibility", "==", "public")],
      ])
      return snap.docs
        .map((row) => mapActivity(row.id, row.data()))
        .filter((a) => a.status !== "cancelled" && a.creatorId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    } catch {
      return []
    }
  },

  async listJoinedBy(userId) {
    try {
      const memberships = await getDocs(
        query(
          collection(getFirebaseDb(), "activityMembers"),
          where("userId", "==", userId),
          where("status", "==", "joined"),
        ),
      )
      const ids = memberships.docs.map((row) => asString(row.data().activityId))
      const activities = await Promise.all(ids.map((id) => firebaseActivities.getById(id)))
      return activities
        .filter((a): a is Activity => Boolean(a))
        .filter((a) => a.status !== "cancelled")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    } catch {
      return []
    }
  },
}

export async function syncCreatorLook(user: { id: string; displayName: string; avatarUrl: string | null }) {
  try {
    const snap = await getDocs(query(collection(getFirebaseDb(), "activities"), where("creatorId", "==", user.id)))
    await Promise.all(
      snap.docs.map((row) =>
        updateDoc(row.ref, {
          creatorName: user.displayName,
          creatorAvatar: user.avatarUrl,
          updatedAt: nowIso(),
        }).catch(() => undefined),
      ),
    )
  } catch {
    /* live overlay still shows the new photo */
  }
}

export const firebaseMembers: MembersRepo = {
  async listByActivity(activityId) {
    const snap = await getDocs(
      query(collection(getFirebaseDb(), "activityMembers"), where("activityId", "==", activityId)),
    )
    const members = snap.docs
      .map((row) => mapMember(row.id, row.data()))
      .filter((m) => m.status === "joined" || m.status === "pending")
    const users = await firebaseUsers.getByIds(members.map((m) => m.userId))
    const byId = Object.fromEntries(users.map((u) => [u.id, u]))
    return members
      .map((m) => (byId[m.userId] ? ({ ...m, user: byId[m.userId] } satisfies MemberWithUser) : null))
      .filter((m): m is MemberWithUser => Boolean(m))
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
  },

  async listByUser(userId) {
    const snap = await getDocs(
      query(collection(getFirebaseDb(), "activityMembers"), where("userId", "==", userId)),
    )
    return snap.docs
      .map((row) => mapMember(row.id, row.data()))
      .filter((m) => m.status === "joined" || m.status === "pending")
  },

  async getMembership(activityId, userId) {
    const snap = await getDoc(doc(getFirebaseDb(), "activityMembers", memberId(activityId, userId)))
    if (!snap.exists()) return null
    const member = mapMember(snap.id, snap.data())
    if (member.status !== "joined" && member.status !== "pending") return null
    const user = await firebaseUsers.getById(userId)
    return user ? { ...member, user } : null
  },

  async join(activityId, userId) {
    const db = getFirebaseDb()
    return runTransaction(db, async (tx) => {
      const actRef = doc(db, "activities", activityId)
      const memRef = doc(db, "activityMembers", memberId(activityId, userId))
      const actSnap = await tx.get(actRef)
      if (!actSnap.exists()) throw new AppError("activityNotFound")
      const activity = mapActivity(actSnap.id, actSnap.data())
      if (activity.status === "cancelled") throw new AppError("activityNotFound")
      if (activity.status === "completed") throw new AppError("activityNotFound")
      const memSnap = await tx.get(memRef)
      if (memSnap.exists() && memSnap.data().status === "joined") throw new AppError("generic")
      if (memSnap.exists() && memSnap.data().status === "pending") throw new AppError("generic")
      if (isActivityFull(activity)) throw new AppError("generic")
      const timestamp = nowIso()
      const auto = (activity.joinPolicy ?? "auto") === "auto"
      tx.set(memRef, {
        id: memRef.id,
        activityId,
        userId,
        status: auto ? "joined" : "pending",
        joinedAt: timestamp,
      })
      if (!auto) {
        tx.update(actRef, { updatedAt: timestamp })
        return { ...activity, updatedAt: timestamp }
      }
      const memberCount = activity.memberCount + 1
      const cap = hardCap(activity)
      const status = cap != null && memberCount >= cap ? "full" : activity.status
      tx.update(actRef, { memberCount, status, updatedAt: timestamp })
      return { ...activity, memberCount, status, updatedAt: timestamp }
    })
  },

  async leave(activityId, userId) {
    const db = getFirebaseDb()
    return runTransaction(db, async (tx) => {
      const actRef = doc(db, "activities", activityId)
      const memRef = doc(db, "activityMembers", memberId(activityId, userId))
      const actSnap = await tx.get(actRef)
      if (!actSnap.exists()) throw new AppError("activityNotFound")
      const activity = mapActivity(actSnap.id, actSnap.data())
      if (activity.creatorId === userId) throw new AppError("onlyOrganizer")
      const memSnap = await tx.get(memRef)
      if (!memSnap.exists() || (memSnap.data().status !== "joined" && memSnap.data().status !== "pending")) {
        throw new AppError("generic")
      }
      const timestamp = nowIso()
      const wasJoined = memSnap.data().status === "joined"
      tx.delete(memRef)
      if (!wasJoined) {
        tx.update(actRef, { updatedAt: timestamp })
        return { ...activity, updatedAt: timestamp }
      }
      const memberCount = Math.max(1, activity.memberCount - 1)
      const status = activity.status === "full" ? "open" : activity.status
      tx.update(actRef, { memberCount, status, updatedAt: timestamp })
      return { ...activity, memberCount, status, updatedAt: timestamp }
    })
  },

  async accept(activityId, userId, actorId) {
    const db = getFirebaseDb()
    return runTransaction(db, async (tx) => {
      const actRef = doc(db, "activities", activityId)
      const memRef = doc(db, "activityMembers", memberId(activityId, userId))
      const actSnap = await tx.get(actRef)
      if (!actSnap.exists()) throw new AppError("activityNotFound")
      const activity = mapActivity(actSnap.id, actSnap.data())
      if (activity.creatorId !== actorId) throw new AppError("onlyOrganizer")
      if (isActivityFull(activity)) throw new AppError("generic")
      const memSnap = await tx.get(memRef)
      if (!memSnap.exists() || memSnap.data().status !== "pending") throw new AppError("generic")
      const timestamp = nowIso()
      const memberCount = activity.memberCount + 1
      const cap = hardCap(activity)
      const status = cap != null && memberCount >= cap ? "full" : activity.status
      tx.update(memRef, { status: "joined" })
      tx.update(actRef, { memberCount, status, updatedAt: timestamp })
      return { ...activity, memberCount, status, updatedAt: timestamp }
    })
  },

  async decline(activityId, userId, actorId) {
    const db = getFirebaseDb()
    return runTransaction(db, async (tx) => {
      const actRef = doc(db, "activities", activityId)
      const memRef = doc(db, "activityMembers", memberId(activityId, userId))
      const actSnap = await tx.get(actRef)
      if (!actSnap.exists()) throw new AppError("activityNotFound")
      const activity = mapActivity(actSnap.id, actSnap.data())
      if (activity.creatorId !== actorId) throw new AppError("onlyOrganizer")
      const memSnap = await tx.get(memRef)
      if (!memSnap.exists() || memSnap.data().status !== "pending") throw new AppError("generic")
      const timestamp = nowIso()
      tx.delete(memRef)
      tx.update(actRef, { updatedAt: timestamp })
      return { ...activity, updatedAt: timestamp }
    })
  },
}

export function watchPublicActivities(onData: (items: Activity[]) => void): Unsubscribe {
  const apply = (docs: { id: string; data: () => DocumentData }[]) => {
    onData(
      docs
        .map((row) => mapActivity(row.id, row.data()))
        .filter((activity) => activity.status !== "cancelled")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  }
  return onSnapshot(
    query(collection(getFirebaseDb(), "activities"), where("visibility", "==", "public")),
    (snap) => apply(snap.docs),
    () => {
      void firebaseActivities
        .list({ limit: 80 })
        .then((page) => onData(page.items))
        .catch(() => onData([]))
    },
  )
}

export function watchMembers(onData: (rows: ActivityMember[]) => void): Unsubscribe {
  return onSnapshot(
    collection(getFirebaseDb(), "activityMembers"),
    (snap) => onData(snap.docs.map((row) => mapMember(row.id, row.data()))),
    () => onData([]),
  )
}
