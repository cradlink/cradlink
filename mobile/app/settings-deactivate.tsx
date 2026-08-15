import { useState } from "react"
import { StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Refreshable } from "@/components/Refreshable"
import { ScreenBlurTarget } from "@/components/ScreenBlurTarget"
import { TopBar } from "@/components/TopBar"
import { Text, View } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useConfirm } from "@/hooks/use-confirm"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { DEACTIVATION_DAYS } from "@/lib/account"
import { errorMessage } from "@/lib/i18n"
import { nowIso } from "@/lib/utils"

export default function DeactivateScreen() {
  const router = useRouter()
  const { user, updateProfile, signOut } = useAuth()
  const { ask } = useConfirm()
  const { show } = useToast()
  const { messages, tx } = useI18n()
  const [busy, setBusy] = useState(false)

  function confirm() {
    ask({
      title: messages.settings.deactivateTitle,
      body: tx(messages.settings.deactivateBody, { days: String(DEACTIVATION_DAYS) }),
      confirmLabel: messages.settings.deactivateConfirm,
      cancelLabel: messages.common.cancel,
      destructive: true,
      onConfirm: () => void pause(),
    })
  }

  async function pause() {
    if (!user || busy) return
    setBusy(true)
    try {
      await updateProfile({ deactivatedAt: nowIso() })
      await signOut()
      router.replace("/login")
    } catch (err) {
      show({ title: errorMessage(err), tone: "error" })
      setBusy(false)
    }
  }

  return (
    <ScreenBlurTarget style={styles.screen}>
      <TopBar title={messages.settings.deactivateTitle} back hideBell />
      <Refreshable contentContainerStyle={styles.body}>
        <Text style={styles.lead}>{messages.settings.deactivateLead}</Text>
        <Text style={styles.copy} lightColor="#536471" darkColor="#71767b">
          {tx(messages.settings.deactivateBody, { days: String(DEACTIVATION_DAYS) })}
        </Text>
        <View style={styles.action} lightColor="transparent" darkColor="transparent">
          <Button
            label={busy ? messages.settings.deactivateWorking : messages.settings.deactivateConfirm}
            variant="ink"
            disabled={busy}
            onPress={confirm}
          />
        </View>
      </Refreshable>
    </ScreenBlurTarget>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  lead: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  copy: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 21,
  },
  action: {
    marginTop: 28,
  },
})
