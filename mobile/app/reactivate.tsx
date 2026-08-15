import { useState } from "react"
import { StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Logo } from "@/components/Logo"
import { Text, View } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { isDeactivationExpired } from "@/lib/account"
import { errorMessage } from "@/lib/i18n"

export default function ReactivateScreen() {
  const router = useRouter()
  const { user, updateProfile, signOut, reload } = useAuth()
  const { show } = useToast()
  const { messages } = useI18n()
  const [busy, setBusy] = useState(false)
  const expired = isDeactivationExpired(user)

  async function restore() {
    if (!user || busy) return
    setBusy(true)
    try {
      await updateProfile({ deactivatedAt: null })
      await reload()
      router.replace("/")
    } catch (err) {
      show({ title: errorMessage(err), tone: "error" })
      setBusy(false)
    }
  }

  async function leave() {
    await signOut()
    router.replace("/login")
  }

  return (
    <View style={styles.screen}>
      <Logo />
      <Text style={styles.title}>
        {expired ? messages.settings.closedTitle : messages.settings.reactivateTitle}
      </Text>
      <Text style={styles.copy} lightColor="#536471" darkColor="#71767b">
        {expired ? messages.settings.closedBody : messages.settings.reactivateBody}
      </Text>
      <View style={styles.actions} lightColor="transparent" darkColor="transparent">
        {expired ? (
          <Button label={messages.settings.signOut} variant="ink" onPress={() => void leave()} />
        ) : (
          <>
            <Button
              label={busy ? messages.settings.reactivateWorking : messages.settings.reactivateConfirm}
              variant="ink"
              disabled={busy}
              onPress={() => void restore()}
            />
            <Button
              label={messages.settings.reactivateStayOut}
              variant="outline"
              disabled={busy}
              onPress={() => void leave()}
            />
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 40,
  },
  title: {
    marginTop: 28,
    fontSize: 31,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  copy: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    marginTop: 28,
    gap: 12,
  },
})
