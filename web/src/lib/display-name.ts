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
import { ensureNameFilter, nameFilterReason } from "@/lib/name-filter";
import { nowIso } from "@/lib/utils";

function throwNameIssue(name: string) {
  const issue = nameFilterReason(name);
  if (issue === "tooShort") throw appError("errors.addName");
  if (issue === "unavailable") throw appError("errors.nameUnavailable");
}

function localNameTaken(name: string, exceptUserId?: string) {
  const handle = displayNameKey(name);
  if (handle.length < 3) return false;
  return Object.values(loadDb().users).some(
    (user) => user.id !== exceptUserId && displayNameKey(user.displayName) === handle,
  );
}

async function firebaseNameTaken(name: string, exceptUserId?: string) {
  const handle = displayNameKey(name);
  if (handle.length < 3) return false;
  const db = getFirebaseDb();

  try {
    const reserved = await getDoc(doc(db, "usernames", handle));
    if (reserved.exists()) return reserved.data().userId !== exceptUserId;
  } catch {
    // Signup may run before auth, or rules may not be published yet.
  }

  try {
    const byKey = await getDocs(
      query(collection(db, "users"), where("displayNameKey", "==", handle), limit(5)),
    );
    if (byKey.docs.some((row) => row.id !== exceptUserId)) return true;

    const listed = await getDocs(query(collection(db, "users"), limit(200)));
    return listed.docs.some(
      (row) => row.id !== exceptUserId && displayNameKey(String(row.data().displayName ?? "")) === handle,
    );
  } catch {
    return false;
  }
}

export async function displayNameTaken(name: string, exceptUserId?: string) {
  if (getBackendName() === "firebase" && isFirebaseConfigured()) {
    return firebaseNameTaken(name, exceptUserId);
  }
  return localNameTaken(name, exceptUserId);
}

export async function assertDisplayNameAvailable(name: string, exceptUserId?: string) {
  await ensureNameFilter();
  throwNameIssue(name);
  if (await displayNameTaken(name, exceptUserId)) {
    throw appError("errors.nameUnavailable");
  }
}

export async function uniqueDisplayName(preferred: string, exceptUserId?: string) {
  await ensureNameFilter();
  const trimmed = preferred.trim();
  if (!nameFilterReason(trimmed) && !(await displayNameTaken(trimmed, exceptUserId))) {
    return trimmed;
  }
  const base = nameFilterReason(trimmed) ? "Member" : trimmed;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}${n}`;
    if (!nameFilterReason(candidate) && !(await displayNameTaken(candidate, exceptUserId))) {
      return candidate;
    }
  }
  throw appError("errors.nameUnavailable");
}

export async function claimDisplayName(
  userId: string,
  displayName: string,
  userPayload?: DocumentData,
) {
  const handle = displayNameKey(displayName);
  if (handle.length < 3) throw appError("errors.addName");
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

      let previous = "";
      if (userSnap.exists()) {
        const data = userSnap.data();
        previous =
          typeof data.username === "string" && data.username
            ? data.username
            : displayNameKey(String(data.displayName ?? ""));
      }

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
            displayName: displayName.trim(),
            username: handle,
            displayNameKey: handle,
            updatedAt: nowIso(),
          },
          { merge: true },
        );
      }
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (isPermissionDenied(err)) {
      if (await firebaseNameTaken(displayName, userId)) throw appError("errors.nameUnavailable");
      return handle;
    }
    throw err;
  }

  return handle;
}

export async function releaseDisplayName(userId: string, nameOrHandle?: string | null) {
  if (!nameOrHandle || getBackendName() !== "firebase" || !isFirebaseConfigured()) return;
  const handle = displayNameKey(nameOrHandle) || nameOrHandle;
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
