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
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: "800",
          letterSpacing: -0.4,
          color: palette.dark.foreground,
        },
        headerTitleAlign: "left",
        headerShadowVisible: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ title: messages.profile.editTitle }} />
    </Stack>
  )
}
