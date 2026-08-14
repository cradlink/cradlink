import { Stack } from "expo-router"

import { palette } from "@/constants/Colors"

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.dark.background },
        animation: "fade",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  )
}
