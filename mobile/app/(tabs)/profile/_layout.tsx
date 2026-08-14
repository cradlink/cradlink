import { Stack } from "expo-router"

import { palette } from "@/constants/Colors"

export default function ProfileStack() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "transparent" },
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: palette.dark.foreground,
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: "800",
          color: palette.dark.foreground,
        },
        headerTitleAlign: "left",
        headerShadowVisible: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
    </Stack>
  )
}
