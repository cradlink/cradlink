import { createContext, useContext, useEffect, useMemo, useState } from "react";
import i18n, { resolveLocale } from "@/i18n";
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
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<User | null>;
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
      if (next?.locale) void i18n.changeLanguage(resolveLocale(next.locale));
    });
  }, [backend]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      signIn: async (input) => {
        const next = await backend.auth.signIn(input);
        setUser(next);
        setReady(true);
        return next;
      },
      signUp: async (input) => {
        const next = await backend.auth.signUp(input);
        setUser(next);
        setReady(true);
        return next;
      },
      signInWithGoogle: async () => {
        const next = await backend.auth.signInWithGoogle();
        setUser(next);
        setReady(true);
        return next;
      },
      signOut: async () => {
        await backend.auth.signOut();
        setUser(null);
      },
      refresh: async () => {
        setUser(await backend.auth.getCurrentUser());
      },
      sendVerificationEmail: () => backend.auth.sendVerificationEmail(),
      reloadUser: async () => {
        const next = await backend.auth.reloadUser();
        setUser(next);
        return next;
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
