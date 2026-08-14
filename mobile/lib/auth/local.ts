import AsyncStorage from "@react-native-async-storage/async-storage"

import { DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD, DEMO_USER_ID } from "@/constants/config"
import { createId, hashPassword } from "@/lib/hash"
import type { User } from "@/lib/types"
import type { AuthRepo, SignInInput, SignUpInput } from "@/lib/auth/types"

const USERS_KEY = "cl.users"
const SESSION_KEY = "cl.session"

type StoredUser = User & { passwordHash: string }

const listeners = new Set<(user: User | null) => void>()

class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AppError"
  }
}

function nowIso() {
  return new Date().toISOString()
}

function publicUser(stored: StoredUser): User {
  const { passwordHash: _, ...user } = stored
  return user
}

async function loadUsers(): Promise<Record<string, StoredUser>> {
  const raw = await AsyncStorage.getItem(USERS_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, StoredUser>
  } catch {
    return {}
  }
}

async function saveUsers(users: Record<string, StoredUser>) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users))
}

async function ensureSeed() {
  const users = await loadUsers()
  if (users[DEMO_USER_ID]) return users
  const timestamp = nowIso()
  users[DEMO_USER_ID] = {
    id: DEMO_USER_ID,
    displayName: "Marko Njegomir",
    email: DEMO_ACCOUNT_EMAIL,
    bio: "Doctoral student. I start things so other people have a place to show up.",
    skills: ["AI", "Research", "Building"],
    avatarUrl: null,
    location: "Belgrade",
    createdAt: timestamp,
    updatedAt: timestamp,
    passwordHash: hashPassword(DEMO_ACCOUNT_PASSWORD),
  }
  await saveUsers(users)
  return users
}

function emit(user: User | null) {
  listeners.forEach((cb) => cb(user))
}

export const localAuth: AuthRepo = {
  async getCurrentUser() {
    const users = await ensureSeed()
    const id = await AsyncStorage.getItem(SESSION_KEY)
    if (!id) return null
    const stored = users[id]
    return stored ? publicUser(stored) : null
  },

  async signUp({ email, password, displayName }: SignUpInput) {
    const users = await ensureSeed()
    const trimmedEmail = email.trim().toLowerCase()
    const name = displayName.trim()
    if (!name) throw new AppError("Please add a name.")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new AppError("That email doesn’t look right.")
    }
    if (password.length < 6) throw new AppError("Password needs at least 6 characters.")
    if (Object.values(users).some((user) => user.email.toLowerCase() === trimmedEmail)) {
      throw new AppError("An account with that email already exists.")
    }

    const timestamp = nowIso()
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
      passwordHash: hashPassword(password),
    }
    users[stored.id] = stored
    await saveUsers(users)
    await AsyncStorage.setItem(SESSION_KEY, stored.id)
    const user = publicUser(stored)
    emit(user)
    return user
  },

  async signIn({ email, password }: SignInInput) {
    const users = await ensureSeed()
    const trimmedEmail = email.trim().toLowerCase()
    const stored = Object.values(users).find((user) => user.email.toLowerCase() === trimmedEmail)
    if (!stored?.passwordHash) throw new AppError("Wrong email or password.")
    const incoming = hashPassword(password)
    if (incoming !== stored.passwordHash) throw new AppError("Wrong email or password.")
    await AsyncStorage.setItem(SESSION_KEY, stored.id)
    const user = publicUser(stored)
    emit(user)
    return user
  },

  async signInAsDemo() {
    return localAuth.signIn({
      email: DEMO_ACCOUNT_EMAIL,
      password: DEMO_ACCOUNT_PASSWORD,
    })
  },

  async signOut() {
    await AsyncStorage.removeItem(SESSION_KEY)
    emit(null)
  },

  onAuthChange(cb) {
    listeners.add(cb)
    void ensureSeed()
      .then(() => localAuth.getCurrentUser())
      .then(cb)
    return () => {
      listeners.delete(cb)
    }
  },
}
