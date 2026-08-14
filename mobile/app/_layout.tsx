import { useEffect } from "react"
import { Appearance } from "react-native"
import { DarkTheme, Stack, ThemeProvider, useRouter, useSegments } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { NavigationBar } from "expo-navigation-bar"
import * as SystemUI from "expo-system-ui"
import "react-native-reanimated"

import { ActivityPreview } from "@/components/ActivityPreview"
import { ConfirmModalHost } from "@/components/ConfirmDialog"
import { ToastHost } from "@/components/ToastHost"
import { View } from "@/components/Themed"
import { palette } from "@/constants/Colors"
import { ActivitiesProvider } from "@/hooks/use-activities"
import { ActivityPreviewProvider } from "@/hooks/use-activity-preview"
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { ConfirmProvider } from "@/hooks/use-confirm"
import { MembershipProvider } from "@/hooks/use-memberships"
import { NotificationsProvider } from "@/hooks/use-notifications"
import { ToastProvider } from "@/hooks/use-toast"

Appearance.setColorScheme("dark")
void SystemUI.setBackgroundColorAsync(palette.dark.background)
NavigationBar.setStyle("dark")

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
  return (
    <ThemeProvider value={cradlinkDark}>
      <AuthGate>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: palette.dark.background },
            headerStyle: { backgroundColor: palette.dark.background },
            headerTintColor: palette.dark.foreground,
            headerShadowVisible: false,
            animation: "fade",
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="activities/new"
            options={{
              headerShown: false,
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="activities/edit/[id]"
            options={{
              headerShown: false,
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
          <Stack.Screen name="activities/[id]" options={{ title: "Activity" }} />
          <Stack.Screen name="u/[userId]" options={{ title: "Profile" }} />
        </Stack>
      </AuthGate>
      <ActivityPreview />
      <ConfirmModalHost />
      <ToastHost />
      <StatusBar style="light" />
      <NavigationBar style="dark" />
    </ThemeProvider>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ActivitiesProvider>
        <MembershipProvider>
          <NotificationsProvider>
            <ActivityPreviewProvider>
              <ConfirmProvider>
                <ToastProvider>
                  <RootNav />
                </ToastProvider>
              </ConfirmProvider>
            </ActivityPreviewProvider>
          </NotificationsProvider>
        </MembershipProvider>
      </ActivitiesProvider>
    </AuthProvider>
  )
}
