import { deleteUser } from "firebase/auth"
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore"

import { AppError } from "@/lib/errors"
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase"
import { normalizeUsername, usernameIssue } from "@/lib/username"
import type { User } from "@/lib/types"
import { nowIso } from "@/lib/utils"

export async function usernameTaken(handle: string, exceptUserId?: string) {
  const snap = await getDoc(doc(getFirebaseDb(), "usernames", handle))
  if (!snap.exists()) return false
  return snap.data().userId !== exceptUserId
}

export async function claimUsername(userId: string, raw: string) {
  const handle = normalizeUsername(raw)
  const issue = usernameIssue(handle)
  if (issue === "tooShort") throw new AppError("usernameTooShort")
  if (issue === "tooLong") throw new AppError("usernameTooLong")
  if (issue === "invalid") throw new AppError("usernameInvalid")
  if (issue === "unavailable") throw new AppError("usernameTaken")

  const db = getFirebaseDb()
  await runTransaction(db, async (tx) => {
    const userRef = doc(db, "users", userId)
    const nameRef = doc(db, "usernames", handle)
    const userSnap = await tx.get(userRef)
    if (!userSnap.exists()) throw new AppError("accountNotFound")
    const nameSnap = await tx.get(nameRef)
    if (nameSnap.exists() && nameSnap.data().userId !== userId) throw new AppError("usernameTaken")
    const previous = typeof userSnap.data().username === "string" ? userSnap.data().username : ""
    if (previous && previous !== handle) {
      const oldRef = doc(db, "usernames", previous)
      const oldSnap = await tx.get(oldRef)
      if (oldSnap.exists() && oldSnap.data().userId === userId) tx.delete(oldRef)
    }
    tx.set(nameRef, { userId, createdAt: nowIso() })
    tx.update(userRef, { username: handle, updatedAt: nowIso() })
  })
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

export async function deleteAccount(user: User) {
  const db = getFirebaseDb()
  const uid = user.id

  const [outgoing, incoming, notes, memberships, created] = await Promise.all([
    getDocs(query(collection(db, "follows"), where("followerId", "==", uid))),
    getDocs(query(collection(db, "follows"), where("followeeId", "==", uid))),
    getDocs(query(collection(db, "notifications"), where("recipientId", "==", uid))),
    getDocs(query(collection(db, "activityMembers"), where("userId", "==", uid))),
    getDocs(query(collection(db, "activities"), where("creatorId", "==", uid))),
  ])

  const createdIds = new Set(created.docs.map((row) => row.id))

  for (const row of memberships.docs) {
    const activityId = String(row.data().activityId ?? "")
    if (!activityId || createdIds.has(activityId)) continue
    await softDeleteOwnComments(activityId, uid).catch(() => undefined)
    const actRef = doc(db, "activities", activityId)
    const actSnap = await getDoc(actRef)
    if (actSnap.exists() && row.data().status === "joined") {
      const count = Math.max(1, Number(actSnap.data().memberCount ?? 1) - 1)
      await updateDoc(actRef, {
        memberCount: count,
        status: actSnap.data().status === "full" ? "open" : actSnap.data().status,
        updatedAt: nowIso(),
      }).catch(() => undefined)
    }
    await deleteDoc(row.ref).catch(() => undefined)
  }

  for (const activity of created.docs) {
    const members = await getDocs(query(collection(db, "activityMembers"), where("activityId", "==", activity.id)))
    await Promise.all(members.docs.map((row) => deleteDoc(row.ref).catch(() => undefined)))
    await deleteDoc(activity.ref).catch(() => undefined)
  }

  await Promise.all([
    ...outgoing.docs.map((row) => deleteDoc(row.ref).catch(() => undefined)),
    ...incoming.docs.map((row) => deleteDoc(row.ref).catch(() => undefined)),
    ...notes.docs.map((row) => deleteDoc(row.ref).catch(() => undefined)),
  ])

  if (user.username) {
    await deleteDoc(doc(db, "usernames", user.username)).catch(() => undefined)
  }

  await deleteDoc(doc(db, "users", uid))

  const current = getFirebaseAuth().currentUser
  if (current) {
    try {
      await deleteUser(current)
    } catch {
      await getFirebaseAuth().signOut()
    }
  }
}
