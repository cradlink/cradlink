import type { UpdateProfileInput, User } from "@/lib/types"

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
  getUser(id: string): Promise<User | null>
  listUsers(): Promise<User[]>
  signUp(input: SignUpInput): Promise<User>
  signIn(input: SignInInput): Promise<User>
  signInWithGoogle(idToken: string): Promise<User>
  updateProfile(input: UpdateProfileInput): Promise<User>
  signOut(): Promise<void>
  onAuthChange(cb: (user: User | null) => void): () => void
}
