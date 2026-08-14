import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { localAuth } from "@/lib/auth/local"
import type { SignInInput, SignUpInput } from "@/lib/auth/types"
import type { User } from "@/lib/types"

type AuthContextValue = {
  user: User | null
  ready: boolean
  signIn: (input: SignInInput) => Promise<User>
  signUp: (input: SignUpInput) => Promise<User>
  signInAsDemo: () => Promise<User>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    return localAuth.onAuthChange((next) => {
      setUser(next)
      setReady(true)
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      signIn: (input) => localAuth.signIn(input),
      signUp: (input) => localAuth.signUp(input),
      signInAsDemo: () => localAuth.signInAsDemo(),
      signOut: () => localAuth.signOut(),
    }),
    [user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
