import { Stack } from "expo-router"

import { palette } from "@/constants/Colors"
import { useI18n } from "@/hooks/use-i18n"

export default function ProfileStack() {
  const { messages } = useI18n()
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: palette.dark.background },
        headerStyle: { backgroundColor: palette.dark.background },
        headerTintColor: palette.dark.foreground,
        headerShadowVisible: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ title: messages.profile.editTitle }} />
    </Stack>
  )
}
