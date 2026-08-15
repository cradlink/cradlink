import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { deleteDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import type { AuthRepo } from "@/lib/auth/types";
import { AppError, appError } from "@/lib/errors";
import { appEnv } from "@/lib/env";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { ensureNameFilter, nameFilterReason, sanitizeDisplayName } from "@/lib/name-filter";
import {
  assertUsernameAvailable,
  claimUsername,
  normalizeUsername,
  releaseUsername,
  uniqueUsername,
} from "@/lib/username";
import type { User } from "@/lib/types";
import { nowIso } from "@/lib/utils";

function mapAuthError(err: unknown): never {
  const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
  const message =
    typeof err === "object" && err && "message" in err ? String((err as { message: string }).message) : "";
  if (code === "auth/email-already-in-use") throw appError("errors.emailInUse");
  if (code === "auth/invalid-email") throw appError("errors.invalidEmail");
  if (code === "auth/weak-password") throw appError("errors.weakPassword");
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    throw appError("errors.wrongCredentials");
  }
  if (code === "auth/popup-closed-by-user") throw appError("errors.googleClosed");
  if (code === "auth/popup-blocked") throw appError("errors.googleBlocked");
  if (
    code === "auth/too-many-requests" ||
    code === "TOO_MANY_ATTEMPTS_TRY_LATER" ||
    message.includes("TOO_MANY_ATTEMPTS")
  ) {
    throw appError("errors.tooManyEmails");
  }
  if (code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri") {
    throw appError("errors.unauthorizedDomain");
  }
  throw appError("errors.tryAgain");
}

function toUser(fbUser: FirebaseUser, data?: Partial<User>): User {
  return {
    id: fbUser.uid,
    displayName: data?.displayName || fbUser.displayName || fbUser.email?.split("@")[0] || "Member",
    email: data?.email || fbUser.email || "",
    bio: data?.bio || "",
    skills: data?.skills || [],
    avatarUrl: data?.avatarUrl ?? fbUser.photoURL,
    bannerUrl: data?.bannerUrl ?? null,
    location: data?.location || "",
    createdAt: data?.createdAt || nowIso(),
    updatedAt: data?.updatedAt || nowIso(),
    emailVerified: fbUser.emailVerified,
    profileVisibility: data?.profileVisibility === "private" ? "private" : "public",
    locale: data?.locale ?? null,
    deactivatedAt: data?.deactivatedAt ?? null,
    username: data?.username ?? null,
  };
}

const VERIFY_COOLDOWN_KEY = "cl_verify_email_sent_at";
const VERIFY_COOLDOWN_MS = 60_000;

async function sendVerification(fbUser: FirebaseUser) {
  if (fbUser.emailVerified) return;
  const last = Number(localStorage.getItem(VERIFY_COOLDOWN_KEY) || 0);
  if (last && Date.now() - last < VERIFY_COOLDOWN_MS) {
    throw appError("errors.waitBeforeResend");
  }
  const apiKey = appEnv.firebase.apiKey;
  if (!apiKey) {
    await sendEmailVerification(fbUser);
    localStorage.setItem(VERIFY_COOLDOWN_KEY, String(Date.now()));
    return;
  }
  const idToken = await fbUser.getIdToken();
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "VERIFY_EMAIL", idToken }),
  });
  const data = (await res.json()) as { error?: { message?: string }; email?: string };
  if (!res.ok) {
    const code = data.error?.message || `auth/send-failed-${res.status}`;
    throw Object.assign(new Error(data.error?.message || "Could not send the confirmation email."), { code });
  }
  localStorage.setItem(VERIFY_COOLDOWN_KEY, String(Date.now()));
}

async function abandonSignup(fbUser: FirebaseUser, username?: string) {
  const db = getFirebaseDb();
  await releaseUsername(fbUser.uid, username);
  await deleteDoc(doc(db, "users", fbUser.uid)).catch(() => undefined);
  await fbUser.delete().catch(() => undefined);
}

async function upsertUserDoc(
  fbUser: FirebaseUser,
  displayName?: string,
  options?: { username?: string },
): Promise<User> {
  const db = getFirebaseDb();
  const ref = doc(db, "users", fbUser.uid);
  const snap = await getDoc(ref);
  await ensureNameFilter();
  const name = sanitizeDisplayName(
    displayName?.trim() || fbUser.displayName || "",
    fbUser.email?.split("@")[0] || "Member",
  );
  const email = fbUser.email ?? "";

  if (!snap.exists()) {
    const handle = options?.username
      ? (await assertUsernameAvailable(options.username, fbUser.uid), normalizeUsername(options.username))
      : await uniqueUsername(name, fbUser.uid);
    const timestamp = nowIso();
    const user = toUser(fbUser, {
      displayName: name,
      email,
      createdAt: timestamp,
      updatedAt: timestamp,
      profileVisibility: "public",
      username: handle,
    });
    const { emailVerified: _verified, ...stored } = user;
    await claimUsername(fbUser.uid, handle, {
      ...stored,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return user;
  }

  const data = snap.data();
  const currentName = (data.displayName as string) || name;
  let username = typeof data.username === "string" ? data.username : null;
  if (!username) {
    username = await uniqueUsername(currentName, fbUser.uid).catch(() => null);
    if (username) await claimUsername(fbUser.uid, username).catch(() => undefined);
  }
  return toUser(fbUser, {
    displayName: currentName,
    email: (data.email as string) || email,
    bio: (data.bio as string) || "",
    skills: (data.skills as string[]) || [],
    avatarUrl: (data.avatarUrl as string | null) ?? fbUser.photoURL,
    bannerUrl: (data.bannerUrl as string | null) ?? null,
    location: (data.location as string) || "",
    createdAt: typeof data.createdAt === "string" ? data.createdAt : nowIso(),
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : nowIso(),
    profileVisibility: data.profileVisibility === "private" ? "private" : "public",
    locale: typeof data.locale === "string" ? data.locale : null,
    deactivatedAt: typeof data.deactivatedAt === "string" ? data.deactivatedAt : null,
    username,
  });
}

async function fromFirebase(fbUser: FirebaseUser | null): Promise<User | null> {
  if (!fbUser) {
    clearSessionCookie();
    return null;
  }
  const user = await upsertUserDoc(fbUser);
  setSessionCookie(user.id);
  return user;
}

export const firebaseAuth: AuthRepo = {
  async getCurrentUser() {
    const current = getFirebaseAuth().currentUser;
    return fromFirebase(current);
  },

  async signUp({ email, password, displayName, username }) {
    const name = displayName.trim();
    await ensureNameFilter();
    const nameIssue = nameFilterReason(name);
    if (nameIssue === "tooShort") throw appError("errors.addName");
    if (nameIssue === "unavailable") throw appError("errors.nameUnavailable");
    await assertUsernameAvailable(username);
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      await updateProfile(cred.user, { displayName: name });
      try {
        const user = await upsertUserDoc(cred.user, name, { username });
        setSessionCookie(user.id);
        try {
          await sendVerification(cred.user);
        } catch (err) {
          console.error("sendEmailVerification failed", err);
        }
        return user;
      } catch (err) {
        await abandonSignup(cred.user, username);
        throw err;
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      mapAuthError(err);
    }
  },

  async signIn({ email, password }) {
    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      return (await fromFirebase(cred.user))!;
    } catch (err) {
      mapAuthError(err);
    }
  },

  async signInWithGoogle() {
    try {
      const cred = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      return (await fromFirebase(cred.user))!;
    } catch (err) {
      mapAuthError(err);
    }
  },

  async signOut() {
    await firebaseSignOut(getFirebaseAuth());
    clearSessionCookie();
  },

  async sendVerificationEmail() {
    const current = getFirebaseAuth().currentUser;
    if (!current) throw appError("errors.signInToSendEmail");
    try {
      await sendVerification(current);
    } catch (err) {
      mapAuthError(err);
    }
  },

  async reloadUser() {
    const current = getFirebaseAuth().currentUser;
    if (!current) return null;
    await current.reload();
    return fromFirebase(getFirebaseAuth().currentUser);
  },

  onAuthChange(cb) {
    return onAuthStateChanged(getFirebaseAuth(), (fbUser) => {
      void fromFirebase(fbUser)
        .then(cb)
        .catch((err) => {
          console.error(err);
          if (!fbUser) {
            cb(null);
            return;
          }
          cb(toUser(fbUser));
        });
    });
  },
};
