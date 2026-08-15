import { useEffect, useState, type ReactNode } from "react"
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native"
import { useRouter } from "expo-router"
import * as ImagePicker from "expo-image-picker"

import { Avatar } from "@/components/Avatar"
import { TopBar } from "@/components/TopBar"
import { Text, View, useTheme } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useConfirm } from "@/hooks/use-confirm"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"

export default function EditProfileScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { user, updateProfile } = useAuth()
  const { ask } = useConfirm()
  const { show } = useToast()
  const { messages } = useI18n()

  const [displayName, setDisplayName] = useState(user?.displayName ?? "")
  const [username, setUsername] = useState(user?.username ?? "")
  const [bio, setBio] = useState(user?.bio ?? "")
  const [location, setLocation] = useState(user?.location ?? "")
  const [skills, setSkills] = useState(user?.skills ?? [])
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)

  const dirty = Boolean(
    user &&
      (displayName !== user.displayName ||
        username !== (user.username ?? "") ||
        bio !== user.bio ||
        location !== user.location ||
        avatarUrl !== user.avatarUrl ||
        skills.join("\0") !== user.skills.join("\0")),
  )
  const canSave = Boolean(user) && displayName.trim().length >= 2 && dirty && !busy

  function close() {
    if (!dirty) {
      router.back()
      return
    }
    ask({
      title: messages.compose.discardEditTitle,
      body: messages.compose.discardEditBody,
      confirmLabel: messages.common.discard,
      cancelLabel: messages.compose.keepEditing,
      destructive: true,
      onConfirm: () => router.back(),
    })
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      close()
      return true
    })
    return () => sub.remove()
  })

  if (!user) return null

  function addSkill() {
    const next = draft.trim()
    if (!next || skills.includes(next)) {
      setDraft("")
      return
    }
    setSkills([...skills, next])
    setDraft("")
  }

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    })
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUrl(result.assets[0].uri)
    }
  }

  async function save() {
    if (!canSave) return
    setBusy(true)
    try {
      await updateProfile({
        displayName: displayName.trim(),
        username: username.trim() || undefined,
        bio: bio.trim(),
        location: location.trim(),
        skills,
        avatarUrl,
      })
      show({ title: messages.profile.saved })
      router.back()
    } catch {
      show({ title: messages.compose.couldntSave, tone: "error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.screen}>
      <TopBar
        title={messages.profile.editTitle}
        back
        onBack={close}
        hideBell
        action={{
          label: busy ? messages.common.saving : messages.common.save,
          onPress: () => void save(),
          disabled: !canSave,
        }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.body}
        >
          <Pressable onPress={() => void pickAvatar()} style={styles.avatarWrap}>
            <Avatar name={displayName || user.displayName} src={avatarUrl} size={80} />
            <Text style={[styles.change, { color: theme.primary }]}>{messages.profile.changePhoto}</Text>
          </Pressable>

          <Field label={messages.username.label}>
            <View style={styles.handleRow}>
              <Text style={styles.at}>@</Text>
              <TextInput
                value={username}
                onChangeText={(text) => setUsername(text.replace(/^@+/, "").toLowerCase())}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={messages.username.placeholder}
                placeholderTextColor={theme.mutedForeground}
                keyboardAppearance="dark"
                selectionColor={theme.primary}
                style={[styles.input, styles.handleInput, { color: theme.foreground, borderBottomColor: theme.border }]}
              />
            </View>
          </Field>

          <Field label={messages.auth.name}>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={messages.auth.namePlaceholder}
              placeholderTextColor={theme.mutedForeground}
              keyboardAppearance="dark"
              selectionColor={theme.primary}
              style={[styles.input, { color: theme.foreground, borderBottomColor: theme.border }]}
            />
          </Field>

          <Field label={messages.profile.location}>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder={messages.profile.locationPlaceholder}
              placeholderTextColor={theme.mutedForeground}
              keyboardAppearance="dark"
              selectionColor={theme.primary}
              style={[styles.input, { color: theme.foreground, borderBottomColor: theme.border }]}
            />
          </Field>

          <Field label={messages.profile.bio}>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder={messages.profile.bioPlaceholder}
              placeholderTextColor={theme.mutedForeground}
              keyboardAppearance="dark"
              selectionColor={theme.primary}
              multiline
              style={[styles.input, styles.bio, { color: theme.foreground, borderBottomColor: theme.border }]}
            />
          </Field>

          <Field label={messages.profile.skills}>
            <View style={styles.skillRow}>
              {skills.map((skill) => (
                <Pressable
                  key={skill}
                  onPress={() => setSkills(skills.filter((item) => item !== skill))}
                  style={styles.skill}
                >
                  <Text style={styles.skillLabel}>{skill}</Text>
                  <Text style={styles.skillX}>×</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={addSkill}
              placeholder={messages.profile.skillPlaceholder}
              placeholderTextColor={theme.mutedForeground}
              keyboardAppearance="dark"
              selectionColor={theme.primary}
              returnKeyType="done"
              style={[styles.input, { color: theme.foreground, borderBottomColor: theme.border }]}
            />
          </Field>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label} lightColor="#536471" darkColor="#71767b">
        {label}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 22,
  },
  avatarWrap: {
    alignItems: "flex-start",
    gap: 10,
  },
  change: {
    fontSize: 15,
    fontWeight: "700",
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  handleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  at: {
    fontSize: 17,
    fontWeight: "700",
  },
  handleInput: {
    flex: 1,
  },
  input: {
    fontSize: 17,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bio: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  skillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "#1d9bf01a",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  skillLabel: {
    fontSize: 13,
    color: "#1d9bf0",
    fontWeight: "600",
  },
  skillX: {
    fontSize: 14,
    color: "#1d9bf0",
  },
})
