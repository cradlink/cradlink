import { type ReactNode } from "react"
import { Pressable } from "react-native"
import { useRouter } from "expo-router"

import { useAuth } from "@/hooks/use-auth"

export function CreatorPress({
  userId,
  children,
}: {
  userId: string
  children: ReactNode
}) {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <Pressable
      hitSlop={6}
      accessibilityRole="link"
      onPress={() => {
        if (user?.id === userId) router.push("/profile")
        else router.push(`/u/${userId}`)
      }}
    >
      {children}
    </Pressable>
  )
}
