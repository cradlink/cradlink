import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore"

import type { AuthRepo } from "@/lib/auth/types"
import { appEnv } from "@/lib/env"
import { AppError } from "@/lib/errors"
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase"
import type { UpdateProfileInput, User } from "@/lib/types"
import { asString, asTime, nowIso, stripUndefined } from "@/lib/utils"

function mapAuthError(err: unknown): never {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : ""
  if (code === "auth/email-already-in-use") throw new AppError("emailTaken")
  if (code === "auth/invalid-email") throw new AppError("emailInvalid")
  if (code === "auth/weak-password") throw new AppError("passwordTooShort")
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    throw new AppError("badCredentials")
  }
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    throw new AppError("googleClosed")
  }
  throw new AppError("googleFailed")
}

function mapUser(id: string, data: Record<string, unknown>, fallback?: Partial<User>): User {
  return {
    id,
    displayName: asString(data.displayName, fallback?.displayName ?? "Member"),
    email: asString(data.email, fallback?.email ?? ""),
    username: asString(data.username) || null,
    bio: asString(data.bio),
    skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
    avatarUrl: (data.avatarUrl as string | null | undefined) ?? fallback?.avatarUrl ?? null,
    bannerUrl: (data.bannerUrl as string | null | undefined) ?? fallback?.bannerUrl ?? null,
    location: asString(data.location),
    visibility: data.profileVisibility === "private" || data.visibility === "private" ? "private" : "public",
    deactivatedAt: asString(data.deactivatedAt) || null,
    createdAt: asTime(data.createdAt),
    updatedAt: asTime(data.updatedAt),
    emailVerified: fallback?.emailVerified,
  }
}

const VERIFY_COOLDOWN_KEY = "cl_verify_email_sent_at"
const VERIFY_COOLDOWN_MS = 60_000

async function sendVerification(fbUser: FirebaseUser) {
  if (fbUser.emailVerified) return
  const last = Number((await AsyncStorage.getItem(VERIFY_COOLDOWN_KEY)) || 0)
  if (last && Date.now() - last < VERIFY_COOLDOWN_MS) throw new AppError("waitBeforeResend")
  const apiKey = appEnv.firebase.apiKey
  const idToken = await fbUser.getIdToken()
  if (!apiKey) throw new AppError("firebaseMissing")
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "VERIFY_EMAIL", idToken }),
  })
  const data = (await res.json()) as { error?: { message?: string } }
  if (!res.ok) {
    const code = data.error?.message || ""
    if (code.includes("TOO_MANY_ATTEMPTS")) throw new AppError("waitBeforeResend")
    throw new AppError("verifySendFailed")
  }
  await AsyncStorage.setItem(VERIFY_COOLDOWN_KEY, String(Date.now()))
}

function withVerified(user: User, fbUser: FirebaseUser): User {
  return { ...user, emailVerified: fbUser.emailVerified }
}

async function upsertUserDoc(fbUser: FirebaseUser, displayName?: string): Promise<User> {
  const db = getFirebaseDb()
  const ref = doc(db, "users", fbUser.uid)
  const snap = await getDoc(ref)
  const name = displayName?.trim() || fbUser.displayName || fbUser.email?.split("@")[0] || "Member"
  const email = fbUser.email ?? ""

  if (!snap.exists()) {
    const timestamp = nowIso()
    const user: User = {
      id: fbUser.uid,
      displayName: name,
      email,
      username: null,
      bio: "",
      skills: [],
      avatarUrl: fbUser.photoURL,
      bannerUrl: null,
      location: "",
      visibility: "public",
      deactivatedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await setDoc(ref, {
      ...user,
      profileVisibility: "public",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return withVerified(user, fbUser)
  }

  return mapUser(fbUser.uid, snap.data() as Record<string, unknown>, {
    displayName: name,
    email,
    avatarUrl: fbUser.photoURL,
    emailVerified: fbUser.emailVerified,
  })
}

async function fromFirebase(fbUser: FirebaseUser | null): Promise<User | null> {
  if (!fbUser) return null
  try {
    return await upsertUserDoc(fbUser)
  } catch {
    const timestamp = nowIso()
    return {
      id: fbUser.uid,
      displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Member",
      email: fbUser.email ?? "",
      username: null,
      bio: "",
      skills: [],
      avatarUrl: fbUser.photoURL,
      bannerUrl: null,
      location: "",
      visibility: "public",
      deactivatedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      emailVerified: fbUser.emailVerified,
    }
  }
}

export const firebaseAuth: AuthRepo = {
  async getCurrentUser() {
    return fromFirebase(getFirebaseAuth().currentUser)
  },

  async getUser(id) {
    const snap = await getDoc(doc(getFirebaseDb(), "users", id))
    return snap.exists() ? mapUser(snap.id, snap.data() as Record<string, unknown>) : null
  },

  async listUsers() {
    const snap = await getDocs(collection(getFirebaseDb(), "users"))
    return snap.docs.map((row) => mapUser(row.id, row.data() as Record<string, unknown>))
  },

  async signUp({ email, password, displayName }) {
    const name = displayName.trim()
    if (name.length < 2) throw new AppError("nameTooShort")
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
      await updateProfile(cred.user, { displayName: name })
      const user = (await upsertUserDoc(cred.user, name))!
      await sendVerification(cred.user).catch(() => undefined)
      return user
    } catch (err) {
      if (err instanceof AppError) throw err
      mapAuthError(err)
    }
  },

  async signIn({ email, password }) {
    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
      return (await fromFirebase(cred.user))!
    } catch (err) {
      mapAuthError(err)
    }
  },

  async signInWithGoogle(idToken, accessToken) {
    try {
      const cred = GoogleAuthProvider.credential(idToken || null, accessToken || undefined)
      const result = await signInWithCredential(getFirebaseAuth(), cred)
      return (await fromFirebase(result.user))!
    } catch (err) {
      mapAuthError(err)
    }
  },

  async updateProfile(input: UpdateProfileInput) {
    const current = getFirebaseAuth().currentUser
    if (!current) throw new AppError("signInFirst")
    const ref = doc(getFirebaseDb(), "users", current.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new AppError("accountNotFound")
    const next = mapUser(current.uid, { ...snap.data(), ...input, updatedAt: nowIso() })
    await updateDoc(
      ref,
      stripUndefined({
        ...input,
        profileVisibility: input.visibility ?? undefined,
        updatedAt: nowIso(),
      }),
    )
    if (input.displayName) await updateProfile(current, { displayName: input.displayName })
    return withVerified(next, current)
  },

  async sendVerificationEmail() {
    const current = getFirebaseAuth().currentUser
    if (!current) throw new AppError("signInFirst")
    await sendVerification(current)
  },

  async reloadUser() {
    const current = getFirebaseAuth().currentUser
    if (!current) return null
    await current.reload()
    return fromFirebase(getFirebaseAuth().currentUser)
  },

  async signOut() {
    await firebaseSignOut(getFirebaseAuth())
  },

  onAuthChange(cb) {
    return onAuthStateChanged(getFirebaseAuth(), (fbUser) => {
      void fromFirebase(fbUser).then(cb).catch(() => cb(null))
    })
  },
}

export function watchUsers(onData: (users: User[]) => void): Unsubscribe {
  return onSnapshot(
    collection(getFirebaseDb(), "users"),
    (snap) => onData(snap.docs.map((row) => mapUser(row.id, row.data() as Record<string, unknown>))),
    () => undefined,
  )
}
