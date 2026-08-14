import { DEMO_GOOGLE_USER_ID, ensureSeed } from "@/lib/data/seed";
import {
  getSessionUserId,
  loadDb,
  publicUser,
  saveDb,
  setSessionUserId,
  type StoredUser,
} from "@/lib/data/store";
import { appError } from "@/lib/errors";
import { ensureNameFilter, nameFilterReason } from "@/lib/name-filter";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import type { User } from "@/lib/types";
import { createId, hashPassword, nowIso } from "@/lib/utils";
import type { AuthRepo, SignInInput, SignUpInput } from "@/lib/auth/types";

const listeners = new Set<(user: User | null) => void>();

function emit(user: User | null) {
  if (user) setSessionCookie(user.id);
  else clearSessionCookie();
  listeners.forEach((cb) => cb(user));
}

function currentUserFromDb(): User | null {
  const id = getSessionUserId();
  if (!id) return null;
  const db = loadDb();
  const stored = db.users[id];
  return stored ? publicUser(stored) : null;
}

export const localAuth: AuthRepo = {
  async getCurrentUser() {
    await ensureSeed();
    return currentUserFromDb();
  },

  async signUp({ email, password, displayName }: SignUpInput) {
    await ensureSeed();
    const trimmedEmail = email.trim().toLowerCase();
    const name = displayName.trim();
    if (!name) throw appError("errors.addName");
    await ensureNameFilter();
    const nameIssue = nameFilterReason(name);
    if (nameIssue === "reserved") throw appError("errors.nameReserved");
    if (nameIssue === "blocked") throw appError("errors.nameBlocked");
    if (nameIssue === "tooShort") throw appError("errors.addName");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw appError("errors.invalidEmail");
    }
    if (password.length < 6) throw appError("errors.weakPassword");

    const db = loadDb();
    if (Object.values(db.users).some((u) => u.email.toLowerCase() === trimmedEmail)) {
      throw appError("errors.emailInUse");
    }

    const timestamp = nowIso();
    const stored: StoredUser = {
      id: createId("user"),
      displayName: name,
      email: trimmedEmail,
      bio: "",
      skills: [],
      avatarUrl: null,
      bannerUrl: null,
      location: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      profileVisibility: "public",
      passwordHash: await hashPassword(password),
    };
    db.users[stored.id] = stored;
    saveDb(db);
    setSessionUserId(stored.id);
    const user = publicUser(stored);
    emit(user);
    return user;
  },

  async signIn({ email, password }: SignInInput) {
    await ensureSeed();
    const trimmedEmail = email.trim().toLowerCase();
    const db = loadDb();
    const stored = Object.values(db.users).find((u) => u.email.toLowerCase() === trimmedEmail);
    if (!stored?.passwordHash) throw appError("errors.wrongCredentials");
    const incoming = await hashPassword(password);
    if (incoming !== stored.passwordHash) throw appError("errors.wrongCredentials");
    setSessionUserId(stored.id);
    const user = publicUser(stored);
    emit(user);
    return user;
  },

  async signInWithGoogle() {
    await ensureSeed();
    const db = loadDb();
    const stored = db.users[DEMO_GOOGLE_USER_ID];
    if (!stored) throw appError("errors.demoGoogleMissing");
    setSessionUserId(stored.id);
    const user = publicUser(stored);
    emit(user);
    return user;
  },

  async signOut() {
    setSessionUserId(null);
    emit(null);
  },

  async sendVerificationEmail() {},

  async reloadUser() {
    return currentUserFromDb();
  },

  onAuthChange(cb) {
    listeners.add(cb);
    void ensureSeed().then(() => cb(currentUserFromDb()));
    return () => {
      listeners.delete(cb);
    };
  },
};
