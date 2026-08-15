import { useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native"
import { Link, useRouter } from "expo-router"
import Svg, { Path } from "react-native-svg"

import { Button } from "@/components/Button"
import { Logo } from "@/components/Logo"
import { Text, View, useTheme } from "@/components/Themed"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/hooks/use-auth"
import { useGoogleAuth } from "@/hooks/use-google-auth"
import { useI18n } from "@/hooks/use-i18n"
import { errorMessage } from "@/lib/i18n"

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const theme = useTheme()
  const router = useRouter()
  const { signIn, signUp } = useAuth()
  const google = useGoogleAuth()
  const { messages } = useI18n()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setPending(true)
    setError(null)
    try {
      if (mode === "signup") {
        await signUp({ email, password, displayName })
      } else {
        await signIn({ email, password })
      }
      router.replace("/")
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  async function onGoogle() {
    setPending(true)
    setError(null)
    try {
      await google.prompt()
      router.replace("/")
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Logo />
        <Text style={styles.title}>{mode === "login" ? messages.auth.welcomeBack : messages.auth.joinToday}</Text>
        <Text style={styles.tagline} lightColor="#536471" darkColor="#71767b">
          {messages.brand.tagline}
        </Text>

        <View style={styles.form} lightColor="transparent" darkColor="transparent">
          {mode === "signup" ? (
            <TextField
              label={messages.auth.name}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={messages.auth.namePlaceholder}
              autoCapitalize="words"
              autoComplete="name"
            />
          ) : null}
          <TextField
            label={messages.auth.email}
            value={email}
            onChangeText={setEmail}
            placeholder={messages.auth.emailPlaceholder}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <TextField
            label={messages.auth.password}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "password"}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={pending ? messages.auth.working : mode === "login" ? messages.auth.signIn : messages.auth.createAccount}
            variant="ink"
            disabled={pending}
            onPress={() => void onSubmit()}
          />
        </View>

        <View style={styles.orRow} lightColor="transparent" darkColor="transparent">
          <View style={[styles.rule, { backgroundColor: theme.border }]} />
          <Text style={styles.or} lightColor="#536471" darkColor="#71767b">
            {messages.common.or}
          </Text>
          <View style={[styles.rule, { backgroundColor: theme.border }]} />
        </View>

        <Pressable
          disabled={pending || !google.ready}
          onPress={() => void onGoogle()}
          style={({ pressed }) => [
            styles.google,
            {
              borderColor: theme.border,
              opacity: pending || !google.ready ? 0.55 : pressed ? 0.75 : 1,
            },
          ]}
        >
          <GoogleMark />
          <Text style={styles.googleLabel}>{messages.auth.continueWithGoogle}</Text>
        </Pressable>

        <View style={styles.footer} lightColor="transparent" darkColor="transparent">
          {mode === "login" ? (
            <View style={styles.switchRow} lightColor="transparent" darkColor="transparent">
              <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
                {messages.auth.noAccount}
              </Text>
              <Link href="/signup" asChild>
                <Pressable>
                  <Text style={styles.link}>{messages.auth.signUp}</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <View style={styles.switchRow} lightColor="transparent" darkColor="transparent">
              <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
                {messages.auth.hasAccount}
              </Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text style={styles.link}>{messages.auth.signIn}</Text>
                </Pressable>
              </Link>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
  },
  title: {
    marginTop: 28,
    fontSize: 31,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  tagline: {
    marginTop: 6,
    fontSize: 15,
  },
  form: {
    marginTop: 28,
    gap: 16,
    backgroundColor: "transparent",
  },
  error: {
    color: "#f4212e",
    fontSize: 14,
  },
  orRow: {
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "transparent",
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  or: {
    fontSize: 13,
  },
  footer: {
    marginTop: 28,
    gap: 12,
    backgroundColor: "transparent",
  },
  switchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    backgroundColor: "transparent",
  },
  meta: {
    fontSize: 15,
  },
  link: {
    fontSize: 15,
    fontWeight: "700",
  },
  google: {
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
})

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.4c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.7z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.5l4-3.1z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z"
      />
    </Svg>
  )
}
