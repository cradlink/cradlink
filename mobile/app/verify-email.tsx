import { useCallback, useEffect, useState } from "react"
import { AppState, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Logo } from "@/components/Logo"
import { Text, View } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { errorMessage } from "@/lib/i18n"
import { needsEmailVerification } from "@/lib/types"

export default function VerifyEmailScreen() {
  const router = useRouter()
  const { user, sendVerificationEmail, reloadUser, signOut } = useAuth()
  const { show } = useToast()
  const { messages, tx } = useI18n()
  const [pending, setPending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const checkVerified = useCallback(async () => {
    setChecking(true)
    try {
      const next = await reloadUser()
      if (next && !needsEmailVerification(next)) {
        show({ title: messages.auth.emailConfirmed })
      }
    } catch (err) {
      show({ title: errorMessage(err), tone: "error" })
    } finally {
      setChecking(false)
    }
  }, [messages.auth.emailConfirmed, reloadUser, show])

  useEffect(() => {
    if (!needsEmailVerification(user)) return
    const onChange = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkVerified()
    })
    const timer = setInterval(() => {
      void checkVerified()
    }, 4000)
    return () => {
      onChange.remove()
      clearInterval(timer)
    }
  }, [checkVerified, user?.id])

  async function resend() {
    setPending(true)
    setSendError(null)
    try {
      await sendVerificationEmail()
      show({ title: messages.auth.verificationSent })
    } catch (err) {
      const message = errorMessage(err)
      setSendError(message)
      show({ title: message, tone: "error" })
    } finally {
      setPending(false)
    }
  }

  async function leave() {
    await signOut()
    router.replace("/login")
  }

  return (
    <View style={styles.screen}>
      <Logo />
      <Text style={styles.title}>{messages.auth.verifyTitle}</Text>
      <Text style={styles.copy} lightColor="#536471" darkColor="#71767b">
        {tx(messages.auth.verifyBody, { email: user?.email ?? "" })}
      </Text>
      {sendError ? <Text style={styles.error}>{sendError}</Text> : null}
      <Text style={styles.hint} lightColor="#536471" darkColor="#71767b">
        {messages.auth.verifyHint}
      </Text>
      <View style={styles.actions} lightColor="transparent" darkColor="transparent">
        <Button
          label={checking ? messages.auth.checking : messages.auth.iveConfirmed}
          variant="ink"
          disabled={checking}
          onPress={() => void checkVerified()}
        />
        <Button
          label={pending ? messages.auth.sending : messages.auth.resendEmail}
          variant="outline"
          disabled={pending}
          onPress={() => void resend()}
        />
        <Button label={messages.auth.useDifferentAccount} variant="ghost" onPress={() => void leave()} />
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
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  copy: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  hint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    marginTop: 12,
    fontSize: 14,
    color: "#f4212e",
  },
  actions: {
    marginTop: 28,
    gap: 10,
  },
})
