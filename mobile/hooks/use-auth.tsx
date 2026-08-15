import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { firebaseAuth } from "@/lib/auth/firebase"
import type { SignInInput, SignUpInput } from "@/lib/auth/types"
import { AppError } from "@/lib/errors"
import { isFirebaseConfigured } from "@/lib/env"
import type { UpdateProfileInput, User } from "@/lib/types"

type AuthContextValue = {
  user: User | null
  ready: boolean
  people: User[]
  getUser: (id: string) => User | null
  signIn: (input: SignInInput) => Promise<User>
  signUp: (input: SignUpInput) => Promise<User>
  signInWithGoogle: (idToken: string) => Promise<User>
  updateProfile: (input: UpdateProfileInput) => Promise<User>
  signOut: () => Promise<void>
  reload: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [directory, setDirectory] = useState<User[]>([])
  const [ready, setReady] = useState(false)

  async function loadPeople() {
    try {
      setDirectory(await firebaseAuth.listUsers())
    } catch {
      setDirectory([])
    }
  }

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setReady(true)
      return
    }
    return firebaseAuth.onAuthChange((next) => {
      setUser(next)
      if (next) {
        void loadPeople().finally(() => setReady(true))
      } else {
        setDirectory([])
        setReady(true)
      }
    })
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const me = user
    return {
      user: me,
      ready,
      people: directory,
      getUser: (id) => {
        if (me?.id === id) return me
        return directory.find((entry) => entry.id === id) ?? null
      },
      signIn: (input) => {
        if (!isFirebaseConfigured()) return Promise.reject(new AppError("firebaseMissing"))
        return firebaseAuth.signIn(input)
      },
      signUp: (input) => {
        if (!isFirebaseConfigured()) return Promise.reject(new AppError("firebaseMissing"))
        return firebaseAuth.signUp(input)
      },
      signInWithGoogle: (idToken) => {
        if (!isFirebaseConfigured()) return Promise.reject(new AppError("firebaseMissing"))
        return firebaseAuth.signInWithGoogle(idToken)
      },
      updateProfile: async (input) => {
        const next = await firebaseAuth.updateProfile(input)
        setUser(next)
        await loadPeople()
        return next
      },
      signOut: () => firebaseAuth.signOut(),
      reload: async () => {
        const next = await firebaseAuth.getCurrentUser()
        setUser(next)
        if (next) await loadPeople()
        else setDirectory([])
      },
    }
  }, [directory, user, ready])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
