import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router"
import { StatusBar } from "expo-status-bar"
import "react-native-reanimated"

import { useColorScheme } from "@/components/useColorScheme"
import { palette } from "@/constants/Colors"

export { ErrorBoundary } from "expo-router"

export const unstable_settings = {
  initialRouteName: "(tabs)",
}

const cradlinkDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.dark.primary,
    background: palette.dark.background,
    card: palette.dark.background,
    text: palette.dark.foreground,
    border: palette.dark.border,
    notification: palette.dark.primary,
  },
}

const cradlinkLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.light.primary,
    background: palette.light.background,
    card: palette.light.background,
    text: palette.light.foreground,
    border: palette.light.border,
    notification: palette.light.primary,
  },
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const dark = colorScheme === "dark"

  return (
    <ThemeProvider value={dark ? cradlinkDark : cradlinkLight}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="activities/new" options={{ title: "New activity", presentation: "modal" }} />
        <Stack.Screen name="activities/[id]" options={{ title: "Activity" }} />
        <Stack.Screen name="u/[userId]" options={{ title: "Profile" }} />
      </Stack>
      <StatusBar style={dark ? "light" : "dark"} />
    </ThemeProvider>
  )
}
