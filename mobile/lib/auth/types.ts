import type { User } from "@/lib/types"

export type SignUpInput = {
  email: string
  password: string
  displayName: string
}

export type SignInInput = {
  email: string
  password: string
}

export type AuthRepo = {
  getCurrentUser(): Promise<User | null>
  signUp(input: SignUpInput): Promise<User>
  signIn(input: SignInInput): Promise<User>
  signInAsDemo(): Promise<User>
  signOut(): Promise<void>
  onAuthChange(cb: (user: User | null) => void): () => void
}
