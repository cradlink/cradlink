import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { firebaseAuth, watchUsers } from "@/lib/auth/firebase"
import type { SignInInput, SignUpInput } from "@/lib/auth/types"
import { claimUsername, deleteAccount } from "@/lib/data/account"
import { syncCreatorLook } from "@/lib/data/firebase"
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
  signInWithGoogle: (idToken?: string | null, accessToken?: string | null) => Promise<User>
  updateProfile: (input: UpdateProfileInput) => Promise<User>
  setUsername: (username: string) => Promise<User>
  deleteAccount: () => Promise<void>
  signOut: () => Promise<void>
  reload: () => Promise<void>
  sendVerificationEmail: () => Promise<void>
  reloadUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [directory, setDirectory] = useState<User[]>([])
  const [ready, setReady] = useState(false)

  const loadPeople = useCallback(async () => {
    try {
      setDirectory(await firebaseAuth.listUsers())
    } catch {
      setDirectory([])
    }
  }, [])

  const getUser = useCallback(
    (id: string) => {
      if (user?.id === id) return user
      return directory.find((entry) => entry.id === id) ?? null
    },
    [directory, user],
  )

  const reload = useCallback(async () => {
    try {
      const next = await firebaseAuth.reloadUser()
      setUser(next)
      if (next) await loadPeople()
      else setDirectory([])
    } catch {
      /* keep the last known user */
    }
  }, [loadPeople])

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setReady(true)
      return
    }
    let unsubUsers: (() => void) | undefined
    const unsubAuth = firebaseAuth.onAuthChange((next) => {
      setUser(next)
      unsubUsers?.()
      unsubUsers = undefined
      if (!next) {
        setDirectory([])
        setReady(true)
        return
      }
      unsubUsers = watchUsers((people) => {
        setDirectory(people)
        setReady(true)
      })
    })
    return () => {
      unsubAuth()
      unsubUsers?.()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const me = user
    return {
      user: me,
      ready,
      people: directory,
      getUser,
      signIn: (input) => {
        if (!isFirebaseConfigured()) return Promise.reject(new AppError("firebaseMissing"))
        return firebaseAuth.signIn(input)
      },
      signUp: (input) => {
        if (!isFirebaseConfigured()) return Promise.reject(new AppError("firebaseMissing"))
        return firebaseAuth.signUp(input)
      },
      signInWithGoogle: (idToken, accessToken) => {
        if (!isFirebaseConfigured()) return Promise.reject(new AppError("firebaseMissing"))
        return firebaseAuth.signInWithGoogle(idToken, accessToken)
      },
      updateProfile: async (input) => {
        if (input.username) {
          const handle = await claimUsername(me!.id, input.username)
          input = { ...input, username: handle }
        }
        const next = await firebaseAuth.updateProfile(input)
        setUser(next)
        if (input.avatarUrl !== undefined || input.displayName) {
          void syncCreatorLook(next)
        }
        await loadPeople()
        return next
      },
      setUsername: async (username) => {
        if (!me) throw new AppError("signInFirst")
        const handle = await claimUsername(me.id, username)
        const next = { ...me, username: handle }
        setUser(next)
        await loadPeople()
        return next
      },
      deleteAccount: async () => {
        if (!me) throw new AppError("signInFirst")
        await deleteAccount(me)
        setUser(null)
        setDirectory([])
      },
      signOut: () => firebaseAuth.signOut(),
      reload,
      sendVerificationEmail: () => firebaseAuth.sendVerificationEmail(),
      reloadUser: async () => {
        const next = await firebaseAuth.reloadUser()
        setUser(next)
        return next
      },
    }
  }, [directory, getUser, loadPeople, ready, reload, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
