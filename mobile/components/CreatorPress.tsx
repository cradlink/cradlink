import { type ReactNode } from "react"
import { Pressable } from "react-native"
import { useRouter } from "expo-router"

import { useActivityPreview } from "@/hooks/use-activity-preview"
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
  const { preview, dismiss } = useActivityPreview()

  return (
    <Pressable
      hitSlop={6}
      accessibilityRole="link"
      onPress={() => {
        if (preview) dismiss()
        if (user?.id === userId) router.push("/profile")
        else router.push(`/u/${userId}`)
      }}
    >
      {children}
    </Pressable>
  )
}
