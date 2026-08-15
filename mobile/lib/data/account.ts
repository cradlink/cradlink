import { deleteUser } from "firebase/auth"
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"

import { AppError } from "@/lib/errors"
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase"
import { handleKey, handleTakenBy, normalizeUsername, usernameIssue } from "@/lib/username"
import type { User } from "@/lib/types"
import { nowIso } from "@/lib/utils"

type HandlePerson = { id: string; username?: string | null; displayName?: string | null }

function firebaseCode(err: unknown) {
  return typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : ""
}

function personFromDoc(id: string, data: Record<string, unknown>): HandlePerson {
  return {
    id,
    username: typeof data.username === "string" ? data.username : null,
    displayName: typeof data.displayName === "string" ? data.displayName : "",
  }
}

async function reservedOwner(handle: string) {
  try {
    const snap = await getDoc(doc(getFirebaseDb(), "usernames", handle))
    if (!snap.exists()) return null
    const owner = String(snap.data()?.userId ?? "")
    return owner || null
  } catch {
    return undefined
  }
}

export async function usernameTaken(handle: string, exceptUserId?: string, known: HandlePerson[] = []) {
  const key = normalizeUsername(handle)
  if (!key) return false
  if (handleTakenBy(known, key, exceptUserId)) return true

  const owner = await reservedOwner(key)
  if (owner && owner !== exceptUserId) return true

  const db = getFirebaseDb()
  try {
    const exact = await getDocs(query(collection(db, "users"), where("username", "==", key)))
    if (exact.docs.some((row) => row.id !== exceptUserId)) return true
  } catch {
    /* fall through to a full scan */
  }

  try {
    const prefixed = await getDocs(query(collection(db, "users"), where("username", "==", `@${key}`)))
    if (prefixed.docs.some((row) => row.id !== exceptUserId)) return true
  } catch {
    /* same */
  }

  try {
    const snap = await getDocs(collection(db, "users"))
    return snap.docs.some((row) => {
      if (exceptUserId && row.id === exceptUserId) return false
      return handleKey(personFromDoc(row.id, row.data() as Record<string, unknown>)) === key
    })
  } catch {
    throw new AppError("usernameTaken")
  }
}

async function reserveHandle(userId: string, handle: string) {
  const ref = doc(getFirebaseDb(), "usernames", handle)
  try {
    const snap = await getDoc(ref)
    if (snap.exists()) {
      if (String(snap.data()?.userId ?? "") !== userId) throw new AppError("usernameTaken")
      return true
    }
    await setDoc(ref, { userId, createdAt: nowIso() })
    return true
  } catch (err) {
    if (err instanceof AppError) throw err
    const code = firebaseCode(err)
    if (code.includes("already-exists") || code.includes("permission-denied")) {
      const owner = await reservedOwner(handle)
      if (owner && owner !== userId) throw new AppError("usernameTaken")
      if (owner === userId) return true
    }
    return false
  }
}

async function releaseHandle(handle: string | null | undefined, userId: string) {
  const key = normalizeUsername(handle ?? "")
  if (!key) return
  try {
    const ref = doc(getFirebaseDb(), "usernames", key)
    const snap = await getDoc(ref)
    if (snap.exists() && String(snap.data()?.userId ?? "") === userId) {
      await deleteDoc(ref)
    }
  } catch {
    /* reservation collection may be unpublished */
  }
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

  const data = userSnap.data() as Record<string, unknown>
  const previous = normalizeUsername(String(data.username ?? ""))
  if (previous === handle) {
    await reserveHandle(userId, handle)
    return handle
  }

  if (await usernameTaken(handle, userId)) throw new AppError("usernameTaken")

  const db = getFirebaseDb()
  const nameRef = doc(db, "usernames", handle)
  try {
    await runTransaction(db, async (tx) => {
      const reserved = await tx.get(nameRef)
      if (reserved.exists() && String(reserved.data()?.userId ?? "") !== userId) {
        throw new AppError("usernameTaken")
      }
      tx.set(nameRef, { userId, createdAt: nowIso() })
      tx.update(userRef, { username: handle, updatedAt: nowIso() })
    })
    if (previous && previous !== handle) await releaseHandle(previous, userId)
    return handle
  } catch (err) {
    if (err instanceof AppError) throw err
  }

  const reserved = await reserveHandle(userId, handle)
  await updateDoc(userRef, { username: handle, updatedAt: nowIso() })

  let stolen = false
  try {
    stolen = await usernameTaken(handle, userId)
  } catch {
    stolen = !reserved
  }
  if (stolen) {
    await updateDoc(userRef, { username: previous || null, updatedAt: nowIso() })
    if (reserved) await releaseHandle(handle, userId)
    throw new AppError("usernameTaken")
  }

  if (previous && previous !== handle) await releaseHandle(previous, userId)
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
  await releaseHandle(user.username, uid)

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
