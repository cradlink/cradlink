import { Stack } from "expo-router"

import { palette } from "@/constants/Colors"

export default function ProfileStack() {
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
      <Stack.Screen name="edit" options={{ title: "Edit profile" }} />
    </Stack>
  )
}
