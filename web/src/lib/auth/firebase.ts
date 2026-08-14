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
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { AuthRepo } from "@/lib/auth/types";
import { AppError } from "@/lib/errors";
import { appEnv } from "@/lib/env";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import type { User } from "@/lib/types";
import { nowIso } from "@/lib/utils";

function mapAuthError(err: unknown): never {
  const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
  const message =
    typeof err === "object" && err && "message" in err ? String((err as { message: string }).message) : "";
  if (code === "auth/email-already-in-use") throw new AppError("An account with that email already exists.");
  if (code === "auth/invalid-email") throw new AppError("That email doesn’t look right.");
  if (code === "auth/weak-password") throw new AppError("Password needs at least 6 characters.");
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    throw new AppError("Wrong email or password.");
  }
  if (code === "auth/popup-closed-by-user") throw new AppError("Google sign-in was closed.");
  if (code === "auth/popup-blocked") throw new AppError("The browser blocked the Google popup.");
  if (
    code === "auth/too-many-requests" ||
    code === "TOO_MANY_ATTEMPTS_TRY_LATER" ||
    message.includes("TOO_MANY_ATTEMPTS")
  ) {
    throw new AppError("Firebase paused confirmation emails. Wait about an hour, then tap Resend once.");
  }
  if (code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri") {
    throw new AppError(
      "Firebase rejected the confirmation link. Add localhost and 127.0.0.1 under Authentication → Settings → Authorized domains.",
    );
  }
  throw new AppError(
    message.replace(/^Firebase:\s*/i, "").replace(/\s*\([^)]*\)\s*$/, "") || "Something went wrong. Try again.",
  );
}

function toUser(fbUser: FirebaseUser, data?: Partial<User>): User {
  return {
    id: fbUser.uid,
    displayName: data?.displayName || fbUser.displayName || fbUser.email?.split("@")[0] || "Member",
    email: data?.email || fbUser.email || "",
    bio: data?.bio || "",
    skills: data?.skills || [],
    avatarUrl: data?.avatarUrl ?? fbUser.photoURL,
    location: data?.location || "",
    createdAt: data?.createdAt || nowIso(),
    updatedAt: data?.updatedAt || nowIso(),
    emailVerified: fbUser.emailVerified,
    profileVisibility: data?.profileVisibility === "private" ? "private" : "public",
  };
}

const VERIFY_COOLDOWN_KEY = "cl_verify_email_sent_at";
const VERIFY_COOLDOWN_MS = 60_000;

async function sendVerification(fbUser: FirebaseUser) {
  if (fbUser.emailVerified) return;
  const last = Number(localStorage.getItem(VERIFY_COOLDOWN_KEY) || 0);
  if (last && Date.now() - last < VERIFY_COOLDOWN_MS) {
    throw new AppError("Wait a minute before sending another confirmation email.");
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

async function upsertUserDoc(fbUser: FirebaseUser, displayName?: string): Promise<User> {
  const db = getFirebaseDb();
  const ref = doc(db, "users", fbUser.uid);
  const snap = await getDoc(ref);
  const name = displayName?.trim() || fbUser.displayName || fbUser.email?.split("@")[0] || "Member";
  const email = fbUser.email ?? "";

  if (!snap.exists()) {
    const timestamp = nowIso();
    const user = toUser(fbUser, {
      displayName: name,
      email,
      createdAt: timestamp,
      updatedAt: timestamp,
      profileVisibility: "public",
    });
    const { emailVerified: _verified, ...stored } = user;
    await setDoc(ref, { ...stored, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return user;
  }

  const data = snap.data();
  return toUser(fbUser, {
    displayName: (data.displayName as string) || name,
    email: (data.email as string) || email,
    bio: (data.bio as string) || "",
    skills: (data.skills as string[]) || [],
    avatarUrl: (data.avatarUrl as string | null) ?? fbUser.photoURL,
    location: (data.location as string) || "",
    createdAt: typeof data.createdAt === "string" ? data.createdAt : nowIso(),
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : nowIso(),
    profileVisibility: data.profileVisibility === "private" ? "private" : "public",
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

  async signUp({ email, password, displayName }) {
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      await updateProfile(cred.user, { displayName: displayName.trim() });
      try {
        await sendVerification(cred.user);
      } catch (err) {
        console.error("sendEmailVerification failed", err);
      }
      return (await fromFirebase(cred.user))!;
    } catch (err) {
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
    if (!current) throw new AppError("Sign in first, then we can send the email.");
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
