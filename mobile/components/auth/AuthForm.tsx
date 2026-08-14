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
import { APP_TAGLINE, DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD } from "@/constants/config"
import { useAuth } from "@/hooks/use-auth"

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const theme = useTheme()
  const router = useRouter()
  const { signIn, signUp, signInAsDemo } = useAuth()
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
      setError(err instanceof Error ? err.message : "Something went wrong.")
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
      setError(err instanceof Error ? err.message : "Something went wrong.")
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
        <Text style={styles.title}>{mode === "login" ? "Welcome back." : "Join today."}</Text>
        <Text style={styles.tagline} lightColor="#536471" darkColor="#71767b">
          {APP_TAGLINE}
        </Text>

        <View style={styles.form} lightColor="transparent" darkColor="transparent">
          {mode === "signup" ? (
            <TextField
              label="Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              autoCapitalize="words"
              autoComplete="name"
            />
          ) : null}
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "password"}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={pending ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
            variant="ink"
            disabled={pending}
            onPress={() => void onSubmit()}
          />
        </View>

        <View style={styles.orRow} lightColor="transparent" darkColor="transparent">
          <View style={[styles.rule, { backgroundColor: theme.border }]} />
          <Text style={styles.or} lightColor="#536471" darkColor="#71767b">
            or
          </Text>
          <View style={[styles.rule, { backgroundColor: theme.border }]} />
        </View>

        <Button
          label="Continue as Marko Njegomir"
          variant="outline"
          disabled={pending}
          onPress={() => void onDemo()}
        />

        <View style={styles.footer} lightColor="transparent" darkColor="transparent">
          {mode === "login" ? (
            <View style={styles.switchRow} lightColor="transparent" darkColor="transparent">
              <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
                Don’t have an account?
              </Text>
              <Link href="/signup" asChild>
                <Pressable>
                  <Text style={styles.link}>Sign up</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <View style={styles.switchRow} lightColor="transparent" darkColor="transparent">
              <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
                Already have an account?
              </Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text style={styles.link}>Sign in</Text>
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
