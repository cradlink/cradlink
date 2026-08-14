import { DEMO_GOOGLE_USER_ID, ensureSeed } from "@/lib/data/seed";
import {
  getSessionUserId,
  loadDb,
  publicUser,
  saveDb,
  setSessionUserId,
  type StoredUser,
} from "@/lib/data/store";
import { AppError } from "@/lib/errors";
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
    if (!name) throw new AppError("Please add a name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new AppError("That email doesn’t look right.");
    }
    if (password.length < 6) throw new AppError("Password needs at least 6 characters.");

    const db = loadDb();
    if (Object.values(db.users).some((u) => u.email.toLowerCase() === trimmedEmail)) {
      throw new AppError("An account with that email already exists.");
    }

    const timestamp = nowIso();
    const stored: StoredUser = {
      id: createId("user"),
      displayName: name,
      email: trimmedEmail,
      bio: "",
      skills: [],
      avatarUrl: null,
      location: "",
      createdAt: timestamp,
      updatedAt: timestamp,
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
    if (!stored?.passwordHash) throw new AppError("Wrong email or password.");
    const incoming = await hashPassword(password);
    if (incoming !== stored.passwordHash) throw new AppError("Wrong email or password.");
    setSessionUserId(stored.id);
    const user = publicUser(stored);
    emit(user);
    return user;
  },

  async signInWithGoogle() {
    await ensureSeed();
    const db = loadDb();
    const stored = db.users[DEMO_GOOGLE_USER_ID];
    if (!stored) throw new AppError("Demo Google account is missing. Refresh and try again.");
    setSessionUserId(stored.id);
    const user = publicUser(stored);
    emit(user);
    return user;
  },

  async signOut() {
    setSessionUserId(null);
    emit(null);
  },

  onAuthChange(cb) {
    listeners.add(cb);
    void ensureSeed().then(() => cb(currentUserFromDb()));
    return () => {
      listeners.delete(cb);
    };
  },
};
