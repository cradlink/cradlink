import { useCallback, useEffect, useState } from "react"
import { Appearance } from "react-native"
import { DarkTheme, Stack, ThemeProvider, usePathname, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { NavigationBar } from "expo-navigation-bar"
import * as SplashScreen from "expo-splash-screen"
import * as SystemUI from "expo-system-ui"
import "react-native-reanimated"

void SplashScreen.preventAutoHideAsync()

import { ActivityPreview } from "@/components/ActivityPreview"
import { ArtRasterHost } from "@/components/ArtRasterHost"
import { BootScreen } from "@/components/BootScreen"
import { ParticleField } from "@/components/ParticleField"
import { ConfirmModalHost } from "@/components/ConfirmDialog"
import { ReplyComposeHost } from "@/components/ReplyCompose"
import { ToastHost } from "@/components/ToastHost"
import { View } from "@/components/Themed"
import { palette } from "@/constants/Colors"
import { onReplayBoot } from "@/lib/boot-preview"
import { ActivitiesProvider } from "@/hooks/use-activities"
import { ActivityPreviewProvider, usePreviewLocksUi } from "@/hooks/use-activity-preview"
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { ConfirmProvider } from "@/hooks/use-confirm"
import { ConnectionsProvider } from "@/hooks/use-connections"
import { useFireflies } from "@/hooks/use-fireflies"
import { I18nProvider, useI18n } from "@/hooks/use-i18n"
import { MembershipProvider } from "@/hooks/use-memberships"
import { NotificationsProvider } from "@/hooks/use-notifications"
import { RepliesProvider } from "@/hooks/use-replies"
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
    background: "transparent",
    card: "transparent",
    text: palette.dark.foreground,
    border: palette.dark.border,
    notification: palette.dark.primary,
  },
}



function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const { ready: localeReady } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const [bootDone, setBootDone] = useState(false)
  const finishBoot = useCallback(() => setBootDone(true), [])

  useEffect(() => onReplayBoot(() => setBootDone(false)), [])

  useEffect(() => {
    if (!ready) return
    const inAuth = pathname === "/login" || pathname === "/signup"
    const picking = pathname === "/username"
    const recovering = pathname === "/reactivate"
    if (!user && (picking || recovering || !inAuth)) {
      router.replace("/login")
    } else if (user?.deactivatedAt && !recovering) {
      router.replace("/reactivate")
    } else if (user && !user.deactivatedAt && !user.username && !picking) {
      router.replace("/username")
    } else if (user && !user.deactivatedAt && user.username && (inAuth || picking || recovering)) {
      router.replace("/")
    }
  }, [user, ready, pathname, router])

  return (
    <>
      {ready ? children : <View style={{ flex: 1 }} />}
      {bootDone ? null : (
        <BootScreen ready={ready && localeReady} onDone={finishBoot} />
      )}
    </>
  )
}

function RootNav() {
  const { messages } = useI18n()
  const { on: fireflies } = useFireflies()
  const previewOpen = usePreviewLocksUi()
  return (
    <ThemeProvider value={cradlinkDark}>
      <View style={{ flex: 1, backgroundColor: palette.dark.background }}>
      {fireflies ? <ParticleField /> : null}
      <AuthGate>
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
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="username" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="reactivate" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="settings-deactivate" options={{ headerShown: false }} />
          <Stack.Screen name="follow-requests" options={{ headerShown: false }} />
          <Stack.Screen name="connections" options={{ headerShown: false }} />
          <Stack.Screen name="activities/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="activities/replies/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="u/[userId]" options={{ headerShown: false }} />
        </Stack>
      </AuthGate>
      <ArtRasterHost />
      <ActivityPreview />
      <ConfirmModalHost active={!previewOpen} />
      <ReplyComposeHost />
      <ToastHost />
      <StatusBar style="light" />
      <NavigationBar style="dark" />
      </View>
    </ThemeProvider>
  )
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ActivitiesProvider>
          <ConnectionsProvider>
          <MembershipProvider>
            <ToastProvider>
            <RepliesProvider>
            <NotificationsProvider>
              <ActivityPreviewProvider>
                <ConfirmProvider>
                    <RootNav />
                </ConfirmProvider>
              </ActivityPreviewProvider>
            </NotificationsProvider>
            </RepliesProvider>
            </ToastProvider>
          </MembershipProvider>
          </ConnectionsProvider>
        </ActivitiesProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
