import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  where,
  type DocumentData,
} from "firebase/firestore";
import { getBackendName } from "@/lib/config";
import { loadDb } from "@/lib/data/store";
import { AppError, appError, isPermissionDenied } from "@/lib/errors";
import { displayNameKey } from "@/lib/format";
import { isFirebaseConfigured, getFirebaseDb } from "@/lib/firebase";
import { ensureNameFilter, handleBlockedReason } from "@/lib/name-filter";
import type { User } from "@/lib/types";
import { nowIso } from "@/lib/utils";

export type UsernameIssue = "tooShort" | "tooLong" | "invalid" | "unavailable";

export function normalizeUsername(value: string) {
  return displayNameKey(value.trim().replace(/^@+/, ""));
}

export function usernameIssue(value: string): UsernameIssue | null {
  const trimmed = value.trim().replace(/^@+/, "");
  const handle = normalizeUsername(trimmed);
  if (handle.length < 3) return "tooShort";
  if (handle.length > 30) return "tooLong";
  if (!/^[a-z0-9_]+$/.test(handle)) return "invalid";
  if (handleBlockedReason(handle) || handleBlockedReason(trimmed)) return "unavailable";
  return null;
}

export function throwUsernameIssue(value: string) {
  const issue = usernameIssue(value);
  if (issue === "tooShort") throw appError("errors.usernameTooShort");
  if (issue === "tooLong") throw appError("errors.usernameTooLong");
  if (issue === "invalid") throw appError("errors.usernameInvalid");
  if (issue === "unavailable") throw appError("errors.nameUnavailable");
}

function localUsernameTaken(handle: string, exceptUserId?: string) {
  return Object.values(loadDb().users).some((user) => {
    if (user.id === exceptUserId) return false;
    const existing = user.username ? normalizeUsername(user.username) : "";
    return existing === handle;
  });
}

async function firebaseUsernameTaken(handle: string, exceptUserId?: string) {
  const db = getFirebaseDb();
  try {
    const reserved = await getDoc(doc(db, "usernames", handle));
    if (reserved.exists()) return reserved.data().userId !== exceptUserId;
  } catch {
    // Signup may run before auth, or rules may not be published yet.
  }

  try {
    const byName = await getDocs(
      query(collection(db, "users"), where("username", "==", handle), limit(5)),
    );
    return byName.docs.some((row) => row.id !== exceptUserId);
  } catch {
    return false;
  }
}

export async function usernameTaken(value: string, exceptUserId?: string) {
  const handle = normalizeUsername(value);
  if (handle.length < 3) return false;
  if (getBackendName() === "firebase" && isFirebaseConfigured()) {
    return firebaseUsernameTaken(handle, exceptUserId);
  }
  return localUsernameTaken(handle, exceptUserId);
}

export async function assertUsernameAvailable(value: string, exceptUserId?: string) {
  await ensureNameFilter();
  throwUsernameIssue(value);
  if (await usernameTaken(value, exceptUserId)) {
    throw appError("errors.nameUnavailable");
  }
}

export async function uniqueUsername(preferred: string, exceptUserId?: string) {
  await ensureNameFilter();
  const base = normalizeUsername(preferred);
  const seed = base.length >= 3 ? base : `user${Math.random().toString(36).slice(2, 6)}`;
  const first = usernameIssue(seed) ? `user${Math.random().toString(36).slice(2, 6)}` : seed;
  if (!(await usernameTaken(first, exceptUserId))) return first;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${first.slice(0, 27)}${n}`;
    if (!usernameIssue(candidate) && !(await usernameTaken(candidate, exceptUserId))) {
      return candidate;
    }
  }
  throw appError("errors.nameUnavailable");
}

export async function claimUsername(userId: string, raw: string, userPayload?: DocumentData) {
  const handle = normalizeUsername(raw);
  throwUsernameIssue(handle);
  if (getBackendName() !== "firebase" || !isFirebaseConfigured()) return handle;

  const db = getFirebaseDb();
  const userRef = doc(db, "users", userId);
  const nameRef = doc(db, "usernames", handle);

  try {
    await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      const nameSnap = await tx.get(nameRef);
      if (nameSnap.exists() && nameSnap.data().userId !== userId) {
        throw appError("errors.nameUnavailable");
      }

      const previous =
        userSnap.exists() && typeof userSnap.data().username === "string"
          ? normalizeUsername(String(userSnap.data().username))
          : "";

      if (previous && previous !== handle) {
        const oldRef = doc(db, "usernames", previous);
        const oldSnap = await tx.get(oldRef);
        if (oldSnap.exists() && oldSnap.data().userId === userId) {
          tx.delete(oldRef);
        }
      }

      tx.set(nameRef, { userId, createdAt: nowIso() });
      if (userPayload || userSnap.exists()) {
        tx.set(
          userRef,
          {
            ...userPayload,
            username: handle,
            updatedAt: nowIso(),
          },
          { merge: true },
        );
      }
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (isPermissionDenied(err)) {
      if (await firebaseUsernameTaken(handle, userId)) throw appError("errors.nameUnavailable");
      return handle;
    }
    throw err;
  }

  return handle;
}

export async function releaseUsername(userId: string, nameOrHandle?: string | null) {
  if (!nameOrHandle || getBackendName() !== "firebase" || !isFirebaseConfigured()) return;
  const handle = normalizeUsername(nameOrHandle) || nameOrHandle;
  if (!handle) return;
  try {
    const ref = doc(getFirebaseDb(), "usernames", handle);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().userId === userId) {
      await deleteDoc(ref);
    }
  } catch {
    // Best-effort cleanup after a failed signup.
  }
}

export function userHandle(user: Pick<User, "displayName" | "username">) {
  return user.username || displayNameKey(user.displayName) || "member";
}
