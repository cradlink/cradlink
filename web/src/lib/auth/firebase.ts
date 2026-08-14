import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { AuthRepo } from "@/lib/auth/types";
import { AppError } from "@/lib/errors";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import type { User } from "@/lib/types";
import { nowIso } from "@/lib/utils";

function mapAuthError(err: unknown): never {
  const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
  if (code === "auth/email-already-in-use") throw new AppError("An account with that email already exists.");
  if (code === "auth/invalid-email") throw new AppError("That email doesn’t look right.");
  if (code === "auth/weak-password") throw new AppError("Password needs at least 6 characters.");
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    throw new AppError("Wrong email or password.");
  }
  if (code === "auth/popup-closed-by-user") throw new AppError("Google sign-in was closed.");
  if (code === "auth/popup-blocked") throw new AppError("The browser blocked the Google popup.");
  throw new AppError("Could not sign you in. Try again.");
}

async function upsertUserDoc(fbUser: FirebaseUser, displayName?: string): Promise<User> {
  const db = getFirebaseDb();
  const ref = doc(db, "users", fbUser.uid);
  const snap = await getDoc(ref);
  const name = displayName?.trim() || fbUser.displayName || fbUser.email?.split("@")[0] || "Member";
  const email = fbUser.email ?? "";

  if (!snap.exists()) {
    const timestamp = nowIso();
    const user: User = {
      id: fbUser.uid,
      displayName: name,
      email,
      bio: "",
      skills: [],
      avatarUrl: fbUser.photoURL,
      location: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await setDoc(ref, { ...user, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return user;
  }

  const data = snap.data();
  return {
    id: fbUser.uid,
    displayName: (data.displayName as string) || name,
    email: (data.email as string) || email,
    bio: (data.bio as string) || "",
    skills: (data.skills as string[]) || [],
    avatarUrl: (data.avatarUrl as string | null) ?? fbUser.photoURL,
    location: (data.location as string) || "",
    createdAt: typeof data.createdAt === "string" ? data.createdAt : nowIso(),
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : nowIso(),
  };
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

  onAuthChange(cb) {
    return onAuthStateChanged(getFirebaseAuth(), (fbUser) => {
      void fromFirebase(fbUser).then(cb).catch((err) => {
        console.error(err);
        cb(null);
      });
    });
  },
};
