import { useEffect } from "react"
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from "expo-router"
import { StatusBar } from "expo-status-bar"
import "react-native-reanimated"

import { View } from "@/components/Themed"
import { useColorScheme } from "@/components/useColorScheme"
import { palette } from "@/constants/Colors"
import { AuthProvider, useAuth } from "@/hooks/use-auth"

export { ErrorBoundary } from "expo-router"

export const unstable_settings = {
  initialRouteName: "(auth)",
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

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!ready) return
    const inAuth = segments[0] === "(auth)"
    if (!user && !inAuth) {
      router.replace("/login")
    } else if (user && inAuth) {
      router.replace("/")
    }
  }, [user, ready, segments, router])

  if (!ready) {
    return <View style={{ flex: 1 }} />
  }

  return children
}

function RootNav() {
  const colorScheme = useColorScheme()
  const dark = colorScheme === "dark"

  return (
    <ThemeProvider value={dark ? cradlinkDark : cradlinkLight}>
      <AuthGate>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="activities/new" options={{ title: "New activity", presentation: "modal" }} />
          <Stack.Screen name="activities/[id]" options={{ title: "Activity" }} />
          <Stack.Screen name="u/[userId]" options={{ title: "Profile" }} />
        </Stack>
      </AuthGate>
      <StatusBar style={dark ? "light" : "dark"} />
    </ThemeProvider>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNav />
    </AuthProvider>
  )
}
