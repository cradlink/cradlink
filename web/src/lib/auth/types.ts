import type { User } from "@/lib/types";

export type SignUpInput = {
  email: string;
  password: string;
  displayName: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type AuthRepo = {
  getCurrentUser(): Promise<User | null>;
  signUp(input: SignUpInput): Promise<User>;
  signIn(input: SignInInput): Promise<User>;
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;
  sendVerificationEmail(): Promise<void>;
  reloadUser(): Promise<User | null>;
  onAuthChange(cb: (user: User | null) => void): () => void;
};
