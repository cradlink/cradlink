import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Logo } from "@/components/Logo"
import { Text, View, useTheme } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { usernameTaken } from "@/lib/data/account"
import { normalizeUsername, suggestUsername, usernameIssue } from "@/lib/username"

export default function UsernameScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { user, people, setUsername } = useAuth()
  const { messages } = useI18n()
  const seed = user?.displayName || user?.email?.split("@")[0] || ""
  const [value, setValue] = useState(suggestUsername(seed))
  const [pending, setPending] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const handle = normalizeUsername(value)
  const issue = usernameIssue(handle)

  const hint = useMemo(() => {
    if (unavailable) return messages.username.taken
    if (!handle) return messages.username.hint
    if (issue === "tooShort") return messages.username.tooShort
    if (issue === "tooLong") return messages.username.tooLong
    if (issue === "invalid" || issue === "unavailable") return messages.username.invalid
    return messages.username.available
  }, [handle, issue, messages.username, unavailable])

  const ok = !issue && handle.length >= 3
  const hintColor = unavailable || issue ? "#f4212e" : ok ? "#00ba7c" : "#71767b"

  async function save() {
    if (!ok || pending) return
    setPending(true)
    setUnavailable(false)
    try {
      const localHit = people.some((person) => person.id !== user?.id && person.username === handle)
      const remoteHit = await usernameTaken(handle, user?.id)
      if (localHit || remoteHit) {
        setUnavailable(true)
        return
      }
      await setUsername(handle)
      router.replace("/")
    } catch {
      setUnavailable(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.content} lightColor="transparent" darkColor="transparent">
        <Logo />
        <Text style={styles.title}>{messages.username.title}</Text>
        <Text style={styles.lead} lightColor="#536471" darkColor="#71767b">
          {messages.username.lead}
        </Text>
        <View style={styles.field} lightColor="transparent" darkColor="transparent">
          <Text style={styles.label}>{messages.username.label}</Text>
          <View style={[styles.inputWrap, { borderColor: theme.border }]}>
            <Text style={styles.at}>@</Text>
            <TextInput
              value={value}
              onChangeText={(text) => {
                setUnavailable(false)
                setValue(normalizeUsername(text))
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              maxLength={20}
              placeholder={messages.username.placeholder}
              placeholderTextColor={theme.mutedForeground}
              keyboardAppearance="dark"
              selectionColor={theme.primary}
              style={[styles.input, { color: theme.foreground }]}
            />
          </View>
          <Text style={styles.hint} lightColor={hintColor} darkColor={hintColor}>
            {hint}
          </Text>
        </View>
        <Button
          label={pending ? messages.username.saving : messages.username.continue}
          variant="ink"
          disabled={!ok || pending || unavailable}
          onPress={() => void save()}
        />
        <Pressable
          disabled={pending}
          onPress={() => setValue(suggestUsername(`${seed}${Math.floor(Math.random() * 90 + 10)}`))}
        >
          <Text style={styles.skip} lightColor="#536471" darkColor="#71767b">
            {messages.username.shuffle}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
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
  lead: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 20,
  },
  field: {
    marginTop: 28,
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputWrap: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  at: {
    fontSize: 18,
    fontWeight: "700",
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: 12,
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
  },
  error: {
    color: "#f4212e",
    fontSize: 14,
    marginBottom: 12,
  },
  skip: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
})
