import { Stack } from "expo-router"

import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"

export default function ProfileStack() {
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
      <Stack.Screen name="index" options={{ title: "Profile" }} />
      <Stack.Screen name="edit" options={{ title: "Edit profile" }} />
    </Stack>
  )
}
