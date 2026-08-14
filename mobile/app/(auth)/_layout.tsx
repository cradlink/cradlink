import { Stack } from "expo-router"

import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"

export default function AuthLayout() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  )
}
