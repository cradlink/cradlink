import { Stack } from "expo-router"

import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"

export default function AuthLayout() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="login" options={{ title: "Log in" }} />
      <Stack.Screen name="signup" options={{ title: "Sign up" }} />
    </Stack>
  )
}
