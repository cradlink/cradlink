import { useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native"
import { Link, useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Logo } from "@/components/Logo"
import { Text, View, useTheme } from "@/components/Themed"
import { TextField } from "@/components/TextField"
import { DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD } from "@/constants/config"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { errorMessage } from "@/lib/i18n"

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const theme = useTheme()
  const router = useRouter()
  const { signIn, signUp, signInAsDemo } = useAuth()
  const { messages } = useI18n()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState(DEMO_ACCOUNT_EMAIL)
  const [password, setPassword] = useState(DEMO_ACCOUNT_PASSWORD)
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

  async function onDemo() {
    setPending(true)
    setError(null)
    try {
      await signInAsDemo()
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

        <Button
          label={messages.auth.continueAsDemo}
          variant="outline"
          disabled={pending}
          onPress={() => void onDemo()}
        />

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
})
