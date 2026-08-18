import { useState } from "react"
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
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"

import { Avatar } from "@/components/Avatar"
import { Text, useTheme } from "@/components/Themed"
import { WhenSheet } from "@/components/WhenSheet"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useConfirm } from "@/hooks/use-confirm"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { ACTIVITY_META } from "@/lib/activity-meta"
import { getDateLocale, tx } from "@/lib/i18n"
import { canRemoveActivity } from "@/lib/schedule"
import { presetsForType, resolveBannerKey } from "@/lib/banners"
import { isLocalImage, uploadActivityImage } from "@/lib/storage"
import {
  ACTIVITY_TYPES,
  type Activity,
  type ActivityType,
  type JoinPolicy,
  type LocationType,
} from "@/lib/types"

const PLACES: LocationType[] = ["in-person", "online", "hybrid"]

function laterToday(hours = 18) {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMinutes(0)
  d.setHours(hours)
  if (d.getTime() <= Date.now()) d.setHours(d.getHours() + 1)
  return d
}

function tomorrowAt(hours = 18) {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(hours, 0, 0, 0)
  return d
}

function formatPicked(d: Date) {
  return d.toLocaleString(getDateLocale(), {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isSameDay(d: Date, offset: number) {
  const target = new Date()
  target.setDate(target.getDate() + offset)
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  )
}

export function ActivityCompose({ activity }: { activity?: Activity }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const { add, update, remove } = useActivities()
  const { ask } = useConfirm()
  const { show } = useToast()
  const { messages } = useI18n()
  const editing = Boolean(activity)

  const [title, setTitle] = useState(activity?.title ?? "")
  const [description, setDescription] = useState(activity?.description ?? "")
  const [type, setType] = useState<ActivityType>(activity?.type ?? "social")
  const [place, setPlace] = useState<LocationType>(activity?.location.type ?? "in-person")
  const [city, setCity] = useState(activity?.location.venue || activity?.location.city || user?.location || "")
  const [joinPolicy, setJoinPolicy] = useState<JoinPolicy>(activity?.joinPolicy ?? "auto")
  const [images, setImages] = useState<string[]>(activity?.images ?? [])
  const [busy, setBusy] = useState(false)
  const [pickerShown, setPickerShown] = useState(false)
  const pickerFade = useSharedValue(0)
  const [flexible, setFlexible] = useState(activity ? activity.isFlexible || !activity.startAt : true)
  const [startAt, setStartAt] = useState<Date | null>(
    activity?.startAt && !activity.isFlexible ? new Date(activity.startAt) : null,
  )
  const [whenOpen, setWhenOpen] = useState(false)

  const originalImages = (activity?.images ?? []).join("|")
  const dirty = editing
    ? title !== (activity?.title ?? "") ||
      description !== (activity?.description ?? "") ||
      type !== (activity?.type ?? "social") ||
      place !== (activity?.location.type ?? "in-person") ||
      joinPolicy !== (activity?.joinPolicy ?? "auto") ||
      images.join("|") !== originalImages ||
      flexible !== (activity ? activity.isFlexible || !activity.startAt : true) ||
      (startAt?.toISOString() ?? null) !== (activity?.startAt && !activity.isFlexible ? activity.startAt : null)
    : title.trim().length > 0 || description.trim().length > 0 || images.length > 0 || startAt != null
  const canPost = title.trim().length >= 3 && description.trim().length >= 10 && !busy && (!editing || dirty)
  const presets = presetsForType(type)
  const MAX_PHOTOS = 6

  function setFlexibleOn() {
    setFlexible(true)
    setStartAt(null)
    setWhenOpen(false)
  }

  function setToday() {
    setFlexible(false)
    setStartAt(laterToday())
    setWhenOpen(true)
  }

  function setTomorrow() {
    setFlexible(false)
    setStartAt(tomorrowAt())
    setWhenOpen(true)
  }

  function setPick() {
    setFlexible(false)
    if (!startAt) setStartAt(laterToday())
    setWhenOpen(true)
  }

  function setTypeAndMaybeClear(next: ActivityType) {
    setType(next)
    const allowed = new Set(presetsForType(next))
    setImages((current) =>
      current.filter(
        (src) =>
          allowed.has(src) ||
          src.startsWith("file") ||
          src.startsWith("content") ||
          src.startsWith("http") ||
          src.startsWith("data:"),
      ),
    )
  }

  function addImages(next: string[]) {
    setImages((current) => [...current, ...next.filter((src) => !current.includes(src))].slice(0, MAX_PHOTOS))
  }

  function hidePicker() {
    setPickerShown(false)
  }

  function openPicker() {
    setPickerShown(true)
    pickerFade.value = 0
    pickerFade.value = withTiming(1, { duration: 280 })
  }

  function closePicker() {
    pickerFade.value = withTiming(0, { duration: 240 }, (finished) => {
      if (finished) runOnJS(hidePicker)()
    })
  }

  const pickerDimStyle = useAnimatedStyle(() => ({
    opacity: pickerFade.value,
  }))

  function close() {
    if (!dirty) {
      router.back()
      return
    }
    ask({
      title: editing ? messages.compose.discardEditTitle : messages.compose.discardNewTitle,
      body: editing ? messages.compose.discardEditBody : messages.compose.discardNewBody,
      confirmLabel: messages.common.discard,
      cancelLabel: editing ? messages.compose.keepEditing : messages.compose.keepWriting,
      destructive: true,
      onConfirm: () => router.back(),
    })
  }

  async function pickOwn() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.65,
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, MAX_PHOTOS - images.length),
    })
    if (!result.canceled && result.assets.length) {
      addImages(result.assets.map((asset) => asset.uri).filter(Boolean))
      closePicker()
    }
  }

  async function post() {
    if (!canPost) return
    setBusy(true)
    try {
      const uploaded = user
        ? await Promise.all(
            images.map((src) => (isLocalImage(src) ? uploadActivityImage(user.id, src) : src)),
          )
        : images
      setImages(uploaded)
      const input = {
        title: title.trim(),
        description: description.trim(),
        type,
        lookingFor: activity?.lookingFor ?? [],
        tags: activity?.tags,
        location: {
          type: place,
          city: place === "online" ? undefined : city.trim() || undefined,
        },
        startAt: !flexible && startAt ? startAt.toISOString() : null,
        endAt: activity?.endAt ?? null,
        isFlexible: flexible || !startAt,
        capacity: activity?.capacity ?? null,
        joinPolicy,
        headcount: activity?.headcount,
        visibility: activity?.visibility,
        images: uploaded,
      }
      if (editing && activity) {
        await update(activity.id, input)
        show({ title: messages.compose.saved })
      } else {
        await add(input)
        show({ title: messages.compose.posted })
      }
      router.back()
    } catch {
      show({ title: editing ? messages.compose.couldntSave : messages.compose.couldntPost, tone: "error" })
    } finally {
      setBusy(false)
    }
  }

  const removable = Boolean(activity && canRemoveActivity(activity))

  async function doRemove() {
    if (!activity) return
    setBusy(true)
    try {
      await remove(activity.id)
      show({ title: messages.compose.deleted })
      router.replace("/me")
    } catch (err) {
      const key = err instanceof Error ? err.message : ""
      show({
        title:
          key === "tooLateToRemove" ? messages.compose.deleteLocked : messages.compose.couldntRemove,
        tone: "error",
      })
    } finally {
      setBusy(false)
    }
  }

  function askRemove() {
    if (!activity) return
    if (!canRemoveActivity(activity)) {
      show({ title: messages.compose.deleteLocked, tone: "error" })
      return
    }
    ask({
      title: messages.compose.deleteTitle,
      body: messages.compose.deleteBody,
      confirmLabel: messages.common.delete,
      destructive: true,
      onConfirm: () => void doRemove(),
    })
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <View style={[styles.top, { borderBottomColor: theme.border }]}>
        <Pressable onPress={close} hitSlop={12} style={styles.iconBtn} accessibilityLabel={messages.common.close}>
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.body}
        >
          <View style={styles.compose}>
            <Avatar name={user?.displayName ?? messages.common.you} src={user?.avatarUrl} size={36} />
            <View style={styles.fields}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={messages.compose.titlePlaceholder}
                placeholderTextColor={theme.mutedForeground}
                keyboardAppearance="dark"
                selectionColor={theme.primary}
                style={[styles.title, { color: theme.foreground }]}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={messages.compose.bodyPlaceholder}
                placeholderTextColor={theme.mutedForeground}
                keyboardAppearance="dark"
                selectionColor={theme.primary}
                multiline
                style={[styles.copy, { color: theme.foreground }]}
              />
            </View>
          </View>

          <Text style={styles.section} lightColor="#536471" darkColor="#71767b">
            {messages.compose.type}
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
                    {messages.types[value]}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <Text style={styles.section} lightColor="#536471" darkColor="#71767b">
            {messages.compose.photos}
          </Text>
          {images.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              {images.map((src) => {
                const preview = resolveBannerKey(src)
                return (
                  <View key={src} style={[styles.photoTile, { borderColor: theme.border }]}>
                    {preview ? <Image source={preview} style={styles.photoImage} /> : null}
                    <Pressable
                      onPress={() => setImages((current) => current.filter((item) => item !== src))}
                      style={styles.photoRemove}
                      hitSlop={8}
                    >
                      <Text style={styles.photoRemoveText}>×</Text>
                    </Pressable>
                  </View>
                )
              })}
              {images.length < MAX_PHOTOS ? (
                <Pressable
                  onPress={openPicker}
                  style={[styles.photoAdd, { borderColor: theme.border, backgroundColor: "#16181c" }]}
                >
                  <Text style={styles.photoAddText}>+</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          ) : (
            <Pressable
              onPress={openPicker}
              style={[styles.bannerSlot, { borderColor: theme.border, backgroundColor: "#16181c" }]}
            >
              <View style={styles.bannerEmpty}>
                <SymbolView
                  name={{ ios: "photo", android: "image", web: "image" }}
                  tintColor={theme.mutedForeground}
                  size={28}
                />
                <Text style={styles.bannerTitle}>{messages.compose.addPhotos}</Text>
                <Text style={styles.bannerSub} lightColor="#536471" darkColor="#71767b">
                  {tx(messages.compose.addBannerSub, { type: messages.types[type] })}
                </Text>
              </View>
            </Pressable>
          )}

          <Text style={styles.section} lightColor="#536471" darkColor="#71767b">
            {messages.compose.where}
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
                    {messages.places[value]}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          {place !== "online" ? (
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder={messages.compose.placeName}
              placeholderTextColor={theme.mutedForeground}
              keyboardAppearance="dark"
              selectionColor={theme.primary}
              autoCorrect={false}
              style={[styles.city, { color: theme.foreground, borderBottomColor: theme.border }]}
            />
          ) : null}

          <Text style={styles.section} lightColor="#536471" darkColor="#71767b">
            {messages.compose.when}
          </Text>
          <View style={styles.row}>
            {(
              [
                { id: "flex", label: messages.schedule.flexible, on: setFlexibleOn, active: flexible },
                { id: "today", label: messages.schedule.today, on: setToday, active: !flexible && !!startAt && isSameDay(startAt, 0) },
                { id: "tmrw", label: messages.schedule.tomorrow, on: setTomorrow, active: !flexible && !!startAt && isSameDay(startAt, 1) },
                { id: "pick", label: messages.schedule.pickDate, on: setPick, active: !flexible && !!startAt && !isSameDay(startAt, 0) && !isSameDay(startAt, 1) },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.id}
                onPress={item.on}
                style={[
                  styles.chip,
                  {
                    borderColor: item.active ? theme.foreground : theme.border,
                    backgroundColor: item.active ? theme.foreground : "transparent",
                  },
                ]}
              >
                <Text style={[styles.chipLabel, { color: item.active ? theme.background : theme.mutedForeground }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {!flexible && startAt ? (
            <Pressable onPress={setPick} style={styles.whenLine}>
              <Text style={styles.whenText}>{formatPicked(startAt)}</Text>
            </Pressable>
          ) : null}

          <Text style={styles.section} lightColor="#536471" darkColor="#71767b">
            {messages.compose.who}
          </Text>
          <View style={styles.row}>
            {(
              [
                { value: "auto" as const, label: messages.compose.anyone },
                { value: "manual" as const, label: messages.compose.request },
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

          {editing ? (
            <View style={styles.dangerBlock}>
              <Pressable
                onPress={askRemove}
                disabled={busy}
                hitSlop={8}
                style={({ pressed }) => [{ opacity: busy ? 0.45 : pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.dangerLabel, !removable && { color: theme.mutedForeground }]}>
                  {messages.compose.delete}
                </Text>
              </Pressable>
              {!removable ? (
                <Text style={styles.dangerHint} lightColor="#536471" darkColor="#71767b">
                  {messages.compose.deleteLocked}
                </Text>
              ) : null}
            </View>
          ) : null}
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
              {busy
                ? editing
                  ? messages.common.saving
                  : messages.compose.posting
                : editing
                  ? messages.common.save
                  : messages.compose.post}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <WhenSheet
        visible={whenOpen}
        value={startAt}
        onClose={() => setWhenOpen(false)}
        onDone={(next) => {
          setFlexible(false)
          setStartAt(next)
          setWhenOpen(false)
        }}
      />

      <Modal visible={pickerShown} transparent animationType="none" onRequestClose={closePicker}>
        <View style={styles.sheetRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePicker}>
            <Animated.View style={[styles.sheetDim, pickerDimStyle]} />
          </Pressable>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16), borderColor: theme.border }]}>
            <Text style={styles.sheetTitle}>{messages.compose.chooseBanner}</Text>
            <Text style={styles.sheetSub} lightColor="#536471" darkColor="#71767b">
              {messages.types[type]}
            </Text>
            <View style={styles.grid}>
              <Pressable onPress={() => void pickOwn()} style={[styles.own, { borderColor: theme.border }]}>
                <SymbolView
                  name={{ ios: "photo.on.rectangle", android: "add_photo_alternate", web: "add_photo_alternate" }}
                  tintColor={theme.foreground}
                  size={22}
                />
                <Text style={styles.ownLabel}>{messages.compose.yourPhoto}</Text>
              </Pressable>
              {presets.map((key) => {
                const src = resolveBannerKey(key)
                if (!src) return null
                const active = images.includes(key)
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      addImages([key])
                      closePicker()
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
  section: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 34,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  city: {
    marginTop: 8,
    fontSize: 15,
    paddingVertical: 6,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  whenLine: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  whenText: {
    fontSize: 15,
    fontWeight: "600",
  },
  dangerBlock: {
    marginTop: 32,
    marginLeft: 12,
    gap: 6,
  },
  dangerLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f4212e",
  },
  dangerHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  photoRow: {
    gap: 8,
    paddingVertical: 2,
  },
  photoTile: {
    width: 112,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: -1,
  },
  photoAdd: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  photoAddText: {
    fontSize: 28,
    fontWeight: "400",
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
    ...StyleSheet.absoluteFill,
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
