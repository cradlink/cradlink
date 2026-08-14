"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getBackend } from "@/lib/backend";
import type { SignInInput, SignUpInput } from "@/lib/auth/types";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  signIn: (input: SignInInput) => Promise<User>;
  signUp: (input: SignUpInput) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const backend = useMemo(() => getBackend(), []);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return backend.auth.onAuthChange((next) => {
      setUser(next);
      setReady(true);
    });
  }, [backend]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      signIn: (input) => backend.auth.signIn(input),
      signUp: (input) => backend.auth.signUp(input),
      signInWithGoogle: () => backend.auth.signInWithGoogle(),
      signOut: () => backend.auth.signOut(),
      refresh: async () => {
        setUser(await backend.auth.getCurrentUser());
      },
    }),
    [backend, ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
