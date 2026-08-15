import { useEffect, useState, type ReactNode } from "react"
import {
  BackHandler,
  Image,
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
import { GeneratedArt } from "@/components/GeneratedArt"
import { TopBar } from "@/components/TopBar"
import { Text, View, useTheme } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useConfirm } from "@/hooks/use-confirm"
import { useHandleAvailability } from "@/hooks/use-handle-availability"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { isGeneratedArt, makeGeneratedArt } from "@/lib/generated-art"
import { errorMessage } from "@/lib/i18n"
import { isLocalImage, uploadAvatar, uploadBanner } from "@/lib/storage"
import { normalizeUsername, usernameIssue } from "@/lib/username"

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
  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl ?? null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const handle = normalizeUsername(username)
  const handleChanged = handle !== normalizeUsername(user?.username ?? "")
  const { taken, checking } = useHandleAvailability(handleChanged ? handle : "", user?.id)
  const handleProblem = handleChanged ? usernameIssue(handle) || (taken ? "unavailable" : null) : null

  const dirty = Boolean(
    user &&
      (displayName !== user.displayName ||
        username !== (user.username ?? "") ||
        bio !== user.bio ||
        location !== user.location ||
        avatarUrl !== user.avatarUrl ||
        bannerUrl !== (user.bannerUrl ?? null) ||
        skills.join("\0") !== user.skills.join("\0")),
  )
  const canSave =
    Boolean(user) &&
    displayName.trim().length >= 2 &&
    dirty &&
    !busy &&
    !checking &&
    !handleProblem &&
    handle.length >= 3

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
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUrl(result.assets[0].uri)
    }
  }

  async function pickBanner() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]?.uri) {
      setBannerUrl(result.assets[0].uri)
    }
  }

  async function save() {
    if (!canSave || !user) return
    setBusy(true)
    try {
      const nextAvatar =
        avatarUrl && (isLocalImage(avatarUrl) || isGeneratedArt(avatarUrl))
          ? await uploadAvatar(user.id, avatarUrl)
          : avatarUrl
      const nextBanner =
        bannerUrl && (isLocalImage(bannerUrl) || isGeneratedArt(bannerUrl))
          ? await uploadBanner(user.id, bannerUrl)
          : bannerUrl
      setAvatarUrl(nextAvatar)
      setBannerUrl(nextBanner)
      await updateProfile({
        displayName: displayName.trim(),
        username: handle,
        bio: bio.trim(),
        location: location.trim(),
        skills,
        avatarUrl: nextAvatar,
        bannerUrl: nextBanner,
      })
      show({ title: messages.profile.saved })
      router.back()
    } catch (err) {
      show({ title: errorMessage(err), tone: "error" })
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
          <View style={styles.photos}>
            <Pressable onPress={() => void pickBanner()} style={styles.bannerTap}>
              {bannerUrl && isGeneratedArt(bannerUrl) ? (
                <GeneratedArt uri={bannerUrl} iconSize={52} style={styles.bannerImage} />
              ) : bannerUrl ? (
                <Image source={{ uri: bannerUrl }} style={styles.bannerImage} />
              ) : (
                <View style={styles.bannerEmpty} />
              )}
            </Pressable>
            <View style={styles.photoActions}>
              <Pressable onPress={() => void pickBanner()}>
                <Text style={[styles.change, { color: theme.primary }]}>
                  {bannerUrl ? messages.profile.changeBanner : messages.profile.addBanner}
                </Text>
              </Pressable>
              <Pressable onPress={() => setBannerUrl(makeGeneratedArt())}>
                <Text style={[styles.change, { color: theme.primary }]}>{messages.profile.generateBanner}</Text>
              </Pressable>
              {bannerUrl ? (
                <Pressable onPress={() => setBannerUrl(null)}>
                  <Text style={styles.remove} lightColor="#536471" darkColor="#71767b">
                    {messages.profile.removeBanner}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.avatarWrap}>
              <Pressable onPress={() => void pickAvatar()}>
                <Avatar name={displayName || user.displayName} src={avatarUrl} size={80} />
              </Pressable>
              <Pressable onPress={() => void pickAvatar()}>
                <Text style={[styles.change, { color: theme.primary }]}>{messages.profile.changePhoto}</Text>
              </Pressable>
              <Pressable onPress={() => setAvatarUrl(makeGeneratedArt())}>
                <Text style={[styles.change, { color: theme.primary }]}>{messages.profile.generatePhoto}</Text>
              </Pressable>
            </View>
          </View>

          <Field label={messages.username.label}>
            <View style={styles.handleRow}>
              <Text style={styles.at}>@</Text>
              <TextInput
                value={username}
                onChangeText={(text) => setUsername(normalizeUsername(text))}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                placeholder={messages.username.placeholder}
                placeholderTextColor={theme.mutedForeground}
                keyboardAppearance="dark"
                selectionColor={theme.primary}
                style={[styles.input, styles.handleInput, { color: theme.foreground, borderBottomColor: theme.border }]}
              />
            </View>
            {handleChanged ? (
              <Text
                style={styles.handleHint}
                lightColor={handleProblem ? "#f4212e" : "#00ba7c"}
                darkColor={handleProblem ? "#f4212e" : "#00ba7c"}
              >
                {handleProblem === "tooShort"
                  ? messages.username.tooShort
                  : handleProblem === "tooLong"
                    ? messages.username.tooLong
                    : handleProblem === "invalid"
                      ? messages.username.invalid
                      : handleProblem === "unavailable"
                        ? messages.username.taken
                        : checking
                          ? messages.username.hint
                          : messages.username.available}
              </Text>
            ) : null}
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
  photos: {
    gap: 10,
  },
  bannerTap: {
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#333639",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerEmpty: {
    flex: 1,
    backgroundColor: "#333639",
  },
  photoActions: {
    gap: 8,
  },
  avatarWrap: {
    alignItems: "flex-start",
    gap: 10,
    marginTop: 6,
  },
  change: {
    fontSize: 15,
    fontWeight: "700",
  },
  remove: {
    fontSize: 14,
    fontWeight: "600",
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
  handleHint: {
    marginTop: 8,
    fontSize: 13,
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
