import { deleteUser } from "firebase/auth"
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"

import { AppError } from "@/lib/errors"
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase"
import { normalizeUsername, usernameIssue } from "@/lib/username"
import type { User } from "@/lib/types"
import { nowIso } from "@/lib/utils"

function readUsername(data: Record<string, unknown>) {
  return String(data.username ?? "").trim().toLowerCase()
}

export async function usernameTaken(handle: string, exceptUserId?: string) {
  const snap = await getDocs(collection(getFirebaseDb(), "users"))
  return snap.docs.some((row) => {
    if (exceptUserId && row.id === exceptUserId) return false
    return readUsername(row.data() as Record<string, unknown>) === handle
  })
}

export async function claimUsername(userId: string, raw: string) {
  const handle = normalizeUsername(raw)
  const issue = usernameIssue(handle)
  if (issue === "tooShort") throw new AppError("usernameTooShort")
  if (issue === "tooLong") throw new AppError("usernameTooLong")
  if (issue === "invalid") throw new AppError("usernameInvalid")
  if (issue === "unavailable") throw new AppError("usernameTaken")

  const userRef = doc(getFirebaseDb(), "users", userId)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) throw new AppError("accountNotFound")
  if (await usernameTaken(handle, userId)) throw new AppError("usernameTaken")
  await updateDoc(userRef, { username: handle, updatedAt: nowIso() })
  if (await usernameTaken(handle, userId)) {
    await updateDoc(userRef, { username: null, updatedAt: nowIso() })
    throw new AppError("usernameTaken")
  }
  return handle
}

async function softDeleteOwnComments(activityId: string, userId: string) {
  const actRef = doc(getFirebaseDb(), "activities", activityId)
  const snap = await getDoc(actRef)
  if (!snap.exists()) return
  const data = snap.data()
  const discussion = Array.isArray(data.discussion) ? data.discussion : []
  let changed = false
  const next = discussion.map((item) => {
    if (!item || typeof item !== "object") return item
    const row = item as { authorId?: string; deletedAt?: string }
    if (row.authorId !== userId || row.deletedAt) return item
    changed = true
    return { ...row, deletedAt: nowIso(), deletedBy: userId }
  })
  if (changed) await updateDoc(actRef, { discussion: next, updatedAt: nowIso() })
}

async function safeDocs(run: () => ReturnType<typeof getDocs>) {
  try {
    return (await run()).docs
  } catch {
    return [] as Awaited<ReturnType<typeof getDocs>>["docs"]
  }
}

export async function deleteAccount(user: User) {
  const db = getFirebaseDb()
  const uid = user.id

  const [outgoing, incoming, notes, memberships, created] = await Promise.all([
    safeDocs(() => getDocs(query(collection(db, "follows"), where("followerId", "==", uid)))),
    safeDocs(() => getDocs(query(collection(db, "follows"), where("followeeId", "==", uid)))),
    safeDocs(() => getDocs(query(collection(db, "notifications"), where("recipientId", "==", uid)))),
    safeDocs(() => getDocs(query(collection(db, "activityMembers"), where("userId", "==", uid)))),
    safeDocs(() => getDocs(query(collection(db, "activities"), where("creatorId", "==", uid)))),
  ])

  const createdIds = new Set(created.map((row) => row.id))

  for (const row of memberships) {
    const data = row.data() as { activityId?: string; status?: string }
    const activityId = String(data.activityId ?? "")
    if (!activityId || createdIds.has(activityId)) continue
    await softDeleteOwnComments(activityId, uid).catch(() => undefined)
    const actRef = doc(db, "activities", activityId)
    const actSnap = await getDoc(actRef)
    if (actSnap.exists() && data.status === "joined") {
      const count = Math.max(1, Number(actSnap.data().memberCount ?? 1) - 1)
      await updateDoc(actRef, {
        memberCount: count,
        status: actSnap.data().status === "full" ? "open" : actSnap.data().status,
        updatedAt: nowIso(),
      }).catch(() => undefined)
    }
    await deleteDoc(row.ref).catch(() => undefined)
  }

  for (const activity of created) {
    const members = await safeDocs(() =>
      getDocs(query(collection(db, "activityMembers"), where("activityId", "==", activity.id))),
    )
    await Promise.all(members.map((row) => deleteDoc(row.ref).catch(() => undefined)))
    await deleteDoc(activity.ref).catch(() => undefined)
  }

  await Promise.all([
    ...outgoing.map((row) => deleteDoc(row.ref).catch(() => undefined)),
    ...incoming.map((row) => deleteDoc(row.ref).catch(() => undefined)),
    ...notes.map((row) => deleteDoc(row.ref).catch(() => undefined)),
  ])

  try {
    await deleteDoc(doc(db, "users", uid))
  } catch {
    await updateDoc(doc(db, "users", uid), { username: null, deactivatedAt: nowIso(), updatedAt: nowIso() }).catch(
      () => undefined,
    )
  }

  const current = getFirebaseAuth().currentUser
  if (current) {
    try {
      await deleteUser(current)
    } catch {
      await getFirebaseAuth().signOut()
    }
  }
}
