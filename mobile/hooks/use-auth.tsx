import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { localAuth } from "@/lib/auth/local"
import type { SignInInput, SignUpInput } from "@/lib/auth/types"
import type { UpdateProfileInput, User } from "@/lib/types"

type AuthContextValue = {
  user: User | null
  ready: boolean
  people: User[]
  getUser: (id: string) => User | null
  signIn: (input: SignInInput) => Promise<User>
  signUp: (input: SignUpInput) => Promise<User>
  signInAsDemo: () => Promise<User>
  updateProfile: (input: UpdateProfileInput) => Promise<User>
  signOut: () => Promise<void>
  reload: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [directory, setDirectory] = useState<User[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    return localAuth.onAuthChange((next) => {
      setUser(next)
      void localAuth.listUsers().then((list) => {
        setDirectory(list)
        setReady(true)
      })
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      people: directory,
      getUser: (id) => {
        if (user?.id === id) return user
        return directory.find((entry) => entry.id === id) ?? null
      },
      signIn: (input) => localAuth.signIn(input),
      signUp: (input) => localAuth.signUp(input),
      signInAsDemo: () => localAuth.signInAsDemo(),
      updateProfile: async (input) => {
        const next = await localAuth.updateProfile(input)
        setUser(next)
        setDirectory(await localAuth.listUsers())
        return next
      },
      signOut: () => localAuth.signOut(),
      reload: async () => {
        const next = await localAuth.getCurrentUser()
        setUser(next)
        setDirectory(await localAuth.listUsers())
      },
    }),
    [directory, user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
