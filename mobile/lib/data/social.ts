import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore"

import { firebaseMembers } from "@/lib/data/firebase"
import { getFirebaseDb } from "@/lib/firebase"
import type { Activity, ActivityReply, AppNotification, FollowRequest, NotificationType } from "@/lib/types"
import { asString, asTime, createId, followId, nowIso, stripUndefined } from "@/lib/utils"

export { followId }

function mapFollow(id: string, data: DocumentData, users?: Record<string, { displayName: string; avatarUrl: string | null }>): FollowRequest {
  const fromId = asString(data.followerId || data.fromId)
  const toId = asString(data.followeeId || data.toId)
  const person = users?.[fromId]
  return {
    id,
    fromId,
    fromName: person?.displayName || asString(data.fromName, "Member"),
    fromAvatar: person?.avatarUrl ?? (data.fromAvatar as string | null) ?? null,
    toId,
    status: data.status === "pending" || data.status === "declined" ? data.status : "accepted",
    createdAt: asTime(data.createdAt),
  }
}

function mapDiscussion(activityId: string, creatorId: string, data: DocumentData): ActivityReply[] {
  if (!Array.isArray(data.discussion)) return []
  const items: ActivityReply[] = []
  for (const row of data.discussion) {
    if (!row || typeof row !== "object") continue
    const item = row as DocumentData
    const id = asString(item.id)
    if (!id) continue
    const deleted = Boolean(item.deletedAt || item.deleted)
    const deletedById = asString(item.deletedBy)
    items.push({
      id,
      activityId: asString(item.activityId, activityId),
      parentId: typeof item.parentId === "string" && item.parentId ? item.parentId : null,
      userId: asString(item.authorId || item.userId),
      userName: asString(item.authorName || item.userName, "Member"),
      userAvatar: (item.authorAvatar as string | null) ?? (item.userAvatar as string | null) ?? null,
      body: asString(item.body),
      createdAt: asTime(item.createdAt),
      deleted,
      deletedBy: deleted ? (deletedById === creatorId ? "host" : "author") : undefined,
    })
  }
  return items
}

function webKindToType(kind: string): NotificationType {
  if (kind === "join_request") return "request"
  if (kind === "followed") return "follow"
  if (kind === "comment") return "reply"
  if (kind === "edited") return "updated"
  if (kind === "reminder_day" || kind === "reminder_hour") return "reminder"
  if (kind === "kicked") return "declined"
  if (
    kind === "joined" ||
    kind === "request" ||
    kind === "accepted" ||
    kind === "declined" ||
    kind === "updated" ||
    kind === "reminder" ||
    kind === "follow" ||
    kind === "follow_request" ||
    kind === "follow_accepted" ||
    kind === "reply"
  ) {
    return kind
  }
  return "updated"
}

function typeToWebKind(type: NotificationType) {
  if (type === "request") return "join_request"
  if (type === "follow") return "followed"
  if (type === "updated") return "edited"
  if (type === "reminder") return "reminder_day"
  return type
}

function mapNotification(id: string, data: DocumentData): AppNotification {
  const kind = asString(data.kind || data.type)
  return {
    id,
    userId: asString(data.recipientId || data.userId),
    type: webKindToType(kind),
    activityId: asString(data.activityId) || null,
    actorId: (data.actorId as string | null) ?? null,
    actorName: asString(data.actorName),
    actorAvatar: (data.actorAvatar as string | null) ?? null,
    title: asString(data.title || data.activityTitle),
    body: asString(data.body),
    createdAt: asTime(data.createdAt),
    read: Boolean(data.read),
  }
}

export function watchFollows(userId: string, onData: (rows: FollowRequest[]) => void): Unsubscribe {
  const db = getFirebaseDb()
  let incoming: FollowRequest[] = []
  let outgoing: FollowRequest[] = []
  let accepted: FollowRequest[] = []

  const publish = () => {
    const byId = new Map<string, FollowRequest>()
    for (const row of [...accepted, ...incoming, ...outgoing]) byId.set(row.id, row)
    onData([...byId.values()])
  }

  const unsubs = [
    onSnapshot(
      query(collection(db, "follows"), where("followeeId", "==", userId)),
      (snap) => {
        incoming = snap.docs.map((row) => mapFollow(row.id, row.data()))
        publish()
      },
      () => {
        incoming = []
        publish()
      },
    ),
    onSnapshot(
      query(collection(db, "follows"), where("followerId", "==", userId)),
      (snap) => {
        outgoing = snap.docs.map((row) => mapFollow(row.id, row.data()))
        publish()
      },
      () => {
        outgoing = []
        publish()
      },
    ),
    onSnapshot(
      query(collection(db, "follows"), where("status", "==", "accepted")),
      (snap) => {
        accepted = snap.docs.map((row) => mapFollow(row.id, row.data()))
        publish()
      },
      () => {
        accepted = incoming.filter((row) => row.status === "accepted").concat(
          outgoing.filter((row) => row.status === "accepted"),
        )
        publish()
      },
    ),
  ]

  return () => unsubs.forEach((stop) => stop())
}

export function watchDiscussions(onData: (rows: ActivityReply[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(getFirebaseDb(), "activities"), where("visibility", "==", "public")),
    (snap) => {
      onData(snap.docs.flatMap((row) => mapDiscussion(row.id, asString(row.data().creatorId), row.data())))
    },
    () => onData([]),
  )
}

export function watchNotifications(
  userId: string,
  onData: (rows: AppNotification[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(getFirebaseDb(), "notifications"), where("recipientId", "==", userId))
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      onData(
        snap.docs
          .map((row) => mapNotification(row.id, row.data()))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      )
    },
    (err) => onError?.(err),
  )
}

export async function writeFollow(input: {
  fromId: string
  toId: string
  status: "pending" | "accepted"
  createdAt?: string
}) {
  const id = followId(input.fromId, input.toId)
  await setDoc(
    doc(getFirebaseDb(), "follows", id),
    stripUndefined({
      id,
      followerId: input.fromId,
      followeeId: input.toId,
      status: input.status,
      createdAt: input.createdAt || nowIso(),
    }),
  )
  return id
}

export async function deleteFollow(id: string) {
  await deleteDoc(doc(getFirebaseDb(), "follows", id))
}

export async function setFollowStatus(id: string, status: "accepted") {
  await updateDoc(doc(getFirebaseDb(), "follows", id), { status })
}

export async function writeReply(input: {
  activity: Activity
  userId: string
  userName: string
  userAvatar: string | null
  body: string
  parentId?: string | null
}) {
  const membership = await firebaseMembers.getMembership(input.activity.id, input.userId)
  const canTalk = input.activity.creatorId === input.userId || membership?.status === "joined"
  if (!canTalk) throw new Error("joinToReply")

  const commentId = createId("cmt")
  const saved = await runTransaction(getFirebaseDb(), async (tx) => {
    const actRef = doc(getFirebaseDb(), "activities", input.activity.id)
    const snap = await tx.get(actRef)
    if (!snap.exists()) throw new Error("activityNotFound")
    const data = snap.data()
    const existing = Array.isArray(data.discussion) ? [...data.discussion] : []
    const parent = input.parentId
      ? existing.find((row) => row && typeof row === "object" && (row as { id?: string }).id === input.parentId)
      : null
    if (input.parentId && !parent) throw new Error("activityNotFound")
    const parentRow = parent as { id?: string; rootId?: string } | null
    const comment = {
      id: commentId,
      activityId: input.activity.id,
      parentId: parentRow?.id ?? null,
      rootId: parentRow?.rootId || parentRow?.id || commentId,
      authorId: input.userId,
      authorName: input.userName,
      authorAvatar: input.userAvatar,
      body: input.body,
      createdAt: nowIso(),
    }
    tx.update(actRef, { discussion: [...existing, stripUndefined(comment)], updatedAt: nowIso() })
    return comment
  })

  return {
    id: saved.id,
    activityId: saved.activityId,
    parentId: saved.parentId,
    userId: saved.authorId,
    userName: saved.authorName,
    userAvatar: saved.authorAvatar,
    body: saved.body,
    createdAt: saved.createdAt,
  } satisfies ActivityReply
}

export async function hideReply(activityId: string, replyId: string, actorId: string) {
  await runTransaction(getFirebaseDb(), async (tx) => {
    const actRef = doc(getFirebaseDb(), "activities", activityId)
    const snap = await tx.get(actRef)
    if (!snap.exists()) return
    const existing = Array.isArray(snap.data().discussion) ? [...snap.data().discussion] : []
    const next = existing.map((row) => {
      if (!row || typeof row !== "object" || (row as { id?: string }).id !== replyId) return row
      return { ...row, deletedAt: nowIso(), deletedBy: actorId }
    })
    tx.update(actRef, { discussion: next.map((row) => stripUndefined(row)), updatedAt: nowIso() })
  })
}

export async function writeNotification(input: {
  id?: string
  userId: string
  type: NotificationType
  activityId: string | null
  activityTitle?: string
  actorId?: string | null
  actorName: string
  actorAvatar: string | null
  title: string
  body: string
}) {
  if (!input.userId || input.userId === input.actorId) return null
  const kind = typeToWebKind(input.type)
  const id = input.id || createId("ntf")
  const ref = doc(getFirebaseDb(), "notifications", id)
  const existing = await getDoc(ref)
  if (existing.exists()) return id
  await setDoc(
    ref,
    stripUndefined({
      id,
      recipientId: input.userId,
      kind,
      activityId: input.activityId ?? "",
      activityTitle: input.activityTitle || input.title,
      actorId: input.actorId ?? null,
      actorName: input.actorName,
      actorAvatar: input.actorAvatar,
      createdAt: nowIso(),
      read: false,
    }),
  )
  return id
}

export async function notifyDiscussion(input: {
  activity: Activity
  comment: ActivityReply
  parent: ActivityReply | null
}) {
  const recipientId = input.parent ? input.parent.userId : input.activity.creatorId
  if (!recipientId || recipientId === input.comment.userId) return null
  const reply = Boolean(input.parent)
  const id = `${reply ? "reply" : "comment"}_${input.comment.id}`
  const ref = doc(getFirebaseDb(), "notifications", id)
  const existing = await getDoc(ref)
  if (existing.exists()) return id
  await setDoc(
    ref,
    stripUndefined({
      id,
      recipientId,
      kind: reply ? "reply" : "comment",
      activityId: input.activity.id,
      activityTitle: input.activity.title,
      actorId: input.comment.userId,
      actorName: input.comment.userName,
      actorAvatar: input.comment.userAvatar,
      commentId: input.comment.id,
      createdAt: nowIso(),
      read: false,
    }),
  )
  return id
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(getFirebaseDb(), "notifications", id), { read: true })
}

export async function markNotificationsRead(ids: string[]) {
  await Promise.all(ids.map((id) => markNotificationRead(id)))
}
