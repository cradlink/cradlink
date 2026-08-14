import { useEffect, useMemo, useRef, useState } from "react"
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native"
import { useRouter } from "expo-router"
import * as ImagePicker from "expo-image-picker"
import { SymbolView } from "expo-symbols"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Avatar } from "@/components/Avatar"
import { Text, useTheme } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useConfirm } from "@/hooks/use-confirm"
import { useToast } from "@/hooks/use-toast"
import { ACTIVITY_META } from "@/lib/activity-meta"
import { presetsForType, resolveBannerKey } from "@/lib/banners"
import { searchPlaces, type PlaceHit } from "@/lib/geocode"
import {
  ACTIVITY_TYPES,
  type ActivityType,
  type JoinPolicy,
  type LocationType,
} from "@/lib/types"

const PLACES: LocationType[] = ["in-person", "online", "hybrid"]

export default function NewActivityScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const { add } = useActivities()
  const { ask } = useConfirm()
  const { show } = useToast()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [lookingFor, setLookingFor] = useState("")
  const [type, setType] = useState<ActivityType>("social")
  const [place, setPlace] = useState<LocationType>("in-person")
  const [city, setCity] = useState(user?.location ?? "")
  const [joinPolicy, setJoinPolicy] = useState<JoinPolicy>("auto")
  const [image, setImage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [placeHits, setPlaceHits] = useState<PlaceHit[]>([])
  const cityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cityAbort = useRef<AbortController | null>(null)
  const skipCitySearch = useRef(false)
  const scrollRef = useRef<ScrollView>(null)

  const dirty = title.trim().length > 0 || description.trim().length > 0 || image != null
  const canPost = title.trim().length >= 3 && description.trim().length >= 10 && !busy
  const presets = presetsForType(type)
  const banner = resolveBannerKey(image ?? undefined)

  const looking = useMemo(
    () =>
      lookingFor
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [lookingFor],
  )

  useEffect(() => {
    if (cityTimer.current) clearTimeout(cityTimer.current)
    cityAbort.current?.abort()
    if (skipCitySearch.current) {
      skipCitySearch.current = false
      return
    }
    const q = city.trim()
    if (place === "online" || q.length < 2) {
      setPlaceHits([])
      return
    }
    cityTimer.current = setTimeout(() => {
      const ctrl = new AbortController()
      cityAbort.current = ctrl
      void searchPlaces(q, ctrl.signal)
        .then((hits) => {
          if (!ctrl.signal.aborted) setPlaceHits(hits)
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setPlaceHits([])
        })
    }, 280)
    return () => {
      if (cityTimer.current) clearTimeout(cityTimer.current)
      cityAbort.current?.abort()
    }
  }, [city, place])

  function choosePlace(hit: PlaceHit) {
    skipCitySearch.current = true
    setCity(hit.label)
    setPlaceHits([])
  }

  function setTypeAndMaybeClear(next: ActivityType) {
    setType(next)
    if (image && presetsForType(next).every((key) => key !== image) && !image.startsWith("file") && !image.startsWith("content")) {
      setImage(null)
    }
  }

  function close() {
    if (!dirty) {
      router.back()
      return
    }
    ask({
      title: "Discard activity?",
      body: "This won’t be saved.",
      confirmLabel: "Discard",
      cancelLabel: "Keep writing",
      destructive: true,
      onConfirm: () => router.back(),
    })
  }

  async function pickOwn() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    })
    if (!result.canceled && result.assets[0]?.uri) {
      setImage(result.assets[0].uri)
      setPickerOpen(false)
    }
  }

  async function post() {
    if (!canPost) return
    setBusy(true)
    try {
      await add({
        title: title.trim(),
        description: description.trim(),
        type,
        lookingFor: looking,
        location: {
          type: place,
          city: place === "online" ? undefined : city.trim() || undefined,
        },
        startAt: null,
        endAt: null,
        isFlexible: true,
        capacity: null,
        joinPolicy,
        images: image ? [image] : [],
      })
      show({ title: "Posted" })
      router.back()
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <View style={[styles.top, { borderBottomColor: theme.border }]}>
        <Pressable onPress={close} hitSlop={12} style={styles.iconBtn} accessibilityLabel="Close">
          <SymbolView
            name={{ ios: "xmark", android: "close", web: "close" }}
            tintColor={theme.foreground}
            size={18}
          />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          contentContainerStyle={styles.body}
        >
          <View style={styles.compose}>
            <Avatar name={user?.displayName ?? "You"} src={user?.avatarUrl} size={36} />
            <View style={styles.fields}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What’s the activity?"
                placeholderTextColor={theme.mutedForeground}
                keyboardAppearance="dark"
                selectionColor={theme.primary}
                style={[styles.title, { color: theme.foreground }]}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What happens, who it’s for, what to bring."
                placeholderTextColor={theme.mutedForeground}
                keyboardAppearance="dark"
                selectionColor={theme.primary}
                multiline
                style={[styles.copy, { color: theme.foreground }]}
              />
              <TextInput
                value={lookingFor}
                onChangeText={setLookingFor}
                placeholder="Looking for — hikers, a driver…"
                placeholderTextColor={theme.mutedForeground}
                keyboardAppearance="dark"
                selectionColor={theme.primary}
                style={[styles.looking, { color: theme.foreground }]}
              />
            </View>
          </View>

          <Text style={styles.section} lightColor="#536471" darkColor="#71767b">
            Type
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {ACTIVITY_TYPES.map((value) => {
              const active = type === value
              return (
                <Pressable
                  key={value}
                  onPress={() => setTypeAndMaybeClear(value)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? theme.foreground : theme.border,
                      backgroundColor: active ? theme.foreground : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: active ? theme.background : ACTIVITY_META[value].color },
                    ]}
                  >
                    {ACTIVITY_META[value].label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <Text style={styles.section} lightColor="#536471" darkColor="#71767b">
            Banner
          </Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={[styles.bannerSlot, { borderColor: theme.border, backgroundColor: "#16181c" }]}
          >
            {banner ? (
              <>
                <Image source={banner} style={styles.bannerImage} />
                <View style={styles.bannerHint}>
                  <Text style={styles.bannerHintText}>Change banner</Text>
                </View>
              </>
            ) : (
              <View style={styles.bannerEmpty}>
                <SymbolView
                  name={{ ios: "photo", android: "image", web: "image" }}
                  tintColor={theme.mutedForeground}
                  size={28}
                />
                <Text style={styles.bannerTitle}>Add a banner</Text>
                <Text style={styles.bannerSub} lightColor="#536471" darkColor="#71767b">
                  Pick one for {ACTIVITY_META[type].label}, or use your photo
                </Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.section} lightColor="#536471" darkColor="#71767b">
            Where
          </Text>
          <View style={styles.row}>
            {PLACES.map((value) => {
              const active = place === value
              return (
                <Pressable
                  key={value}
                  onPress={() => setPlace(value)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? theme.foreground : theme.border,
                      backgroundColor: active ? theme.foreground : "transparent",
                    },
                  ]}
                >
                  <Text style={[styles.chipLabel, { color: active ? theme.background : theme.mutedForeground }]}>
                    {value === "in-person" ? "In person" : value === "online" ? "Online" : "Hybrid"}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          {place !== "online" ? (
            <View style={styles.cityWrap}>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={theme.mutedForeground}
                keyboardAppearance="dark"
                selectionColor={theme.primary}
                autoCorrect={false}
                autoCapitalize="words"
                style={[styles.city, { color: theme.foreground, borderBottomColor: theme.border }]}
              />
              {placeHits.length > 0 ? (
                <View style={[styles.suggest, { borderColor: theme.border }]}>
                  {placeHits.map((hit) => (
                    <Pressable
                      key={hit.id}
                      onPressIn={() => choosePlace(hit)}
                      style={styles.suggestRow}
                    >
                      <Text style={styles.suggestName}>{hit.name}</Text>
                      <Text style={styles.suggestMeta} lightColor="#536471" darkColor="#71767b">
                        {[hit.admin1, hit.country].filter(Boolean).join(", ")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.section} lightColor="#536471" darkColor="#71767b">
            Who can join
          </Text>
          <View style={styles.row}>
            {(
              [
                { value: "auto" as const, label: "Anyone" },
                { value: "manual" as const, label: "Request" },
              ]
            ).map((item) => {
              const active = joinPolicy === item.value
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setJoinPolicy(item.value)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? theme.foreground : theme.border,
                      backgroundColor: active ? theme.foreground : "transparent",
                    },
                  ]}
                >
                  <Text style={[styles.chipLabel, { color: active ? theme.background : theme.mutedForeground }]}>
                    {item.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            onPress={() => void post()}
            disabled={!canPost}
            style={({ pressed }) => [
              styles.post,
              {
                backgroundColor: theme.foreground,
                opacity: !canPost ? 0.35 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.postLabel, { color: theme.background }]}>
              {busy ? "Posting…" : "Post activity"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.sheetRoot}>
          <Pressable style={styles.sheetDim} onPress={() => setPickerOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16), borderColor: theme.border }]}>
            <Text style={styles.sheetTitle}>Choose a banner</Text>
            <Text style={styles.sheetSub} lightColor="#536471" darkColor="#71767b">
              {ACTIVITY_META[type].label}
            </Text>
            <View style={styles.grid}>
              <Pressable onPress={() => void pickOwn()} style={[styles.own, { borderColor: theme.border }]}>
                <SymbolView
                  name={{ ios: "photo.on.rectangle", android: "add_photo_alternate", web: "add_photo_alternate" }}
                  tintColor={theme.foreground}
                  size={22}
                />
                <Text style={styles.ownLabel}>Your photo</Text>
              </Pressable>
              {presets.map((key) => {
                const src = resolveBannerKey(key)
                if (!src) return null
                const active = image === key
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      setImage(key)
                      setPickerOpen(false)
                    }}
                    style={[styles.preset, active && { borderColor: theme.foreground }]}
                  >
                    <Image source={src} style={styles.presetImage} />
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>
      </Modal>
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
  top: {
    height: 48,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  compose: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  fields: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
    padding: 0,
  },
  copy: {
    minHeight: 80,
    fontSize: 16,
    lineHeight: 21,
    padding: 0,
    textAlignVertical: "top",
  },
  looking: {
    fontSize: 15,
    padding: 0,
  },
  section: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  cityWrap: {
    zIndex: 4,
  },
  city: {
    marginTop: 8,
    fontSize: 15,
    paddingVertical: 6,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggest: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "#16181c",
    overflow: "hidden",
  },
  suggestRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  suggestName: {
    fontSize: 15,
    fontWeight: "700",
  },
  suggestMeta: {
    fontSize: 12,
  },
  bannerSlot: {
    alignSelf: "stretch",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 24,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  bannerSub: {
    fontSize: 13,
    textAlign: "center",
  },
  bannerHint: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bannerHintText: {
    color: "#e7e9ea",
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  post: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  postLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  sheetRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#16181c",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  sheetSub: {
    marginTop: 2,
    marginBottom: 14,
    fontSize: 13,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  own: {
    width: "48%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#000000",
  },
  ownLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  preset: {
    width: "48%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  presetImage: {
    width: "100%",
    height: "100%",
  },
})
