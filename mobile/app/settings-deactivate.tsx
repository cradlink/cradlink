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
import { errorMessage } from "@/lib/i18n"

export default function DeactivateScreen() {
  const router = useRouter()
  const { user, deleteAccount } = useAuth()
  const { ask } = useConfirm()
  const { show } = useToast()
  const { messages } = useI18n()
  const [busy, setBusy] = useState(false)

  function confirm() {
    ask({
      title: messages.settings.deleteTitle,
      body: messages.settings.deleteBody,
      confirmLabel: messages.settings.deleteConfirm,
      cancelLabel: messages.common.cancel,
      destructive: true,
      onConfirm: () => void wipe(),
    })
  }

  async function wipe() {
    if (!user || busy) return
    setBusy(true)
    try {
      await deleteAccount()
      router.replace("/login")
    } catch (err) {
      show({ title: errorMessage(err), tone: "error" })
      setBusy(false)
    }
  }

  return (
    <ScreenBlurTarget style={styles.screen}>
      <TopBar title={messages.settings.deleteAccount} back hideBell />
      <Refreshable contentContainerStyle={styles.body}>
        <Text style={styles.lead}>{messages.settings.deleteLead}</Text>
        <Text style={styles.copy} lightColor="#536471" darkColor="#71767b">
          {messages.settings.deleteCopy}
        </Text>
        <View style={styles.action} lightColor="transparent" darkColor="transparent">
          <Button
            label={busy ? messages.settings.deleteWorking : messages.settings.deleteConfirm}
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
