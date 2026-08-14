import { useEffect } from "react"
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View as RNView } from "react-native"
import { BlurView } from "expo-blur"
import { SymbolView } from "expo-symbols"
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { ActivityCover } from "@/components/ActivityCover"
import { Avatar } from "@/components/Avatar"
import { JoinButton } from "@/components/JoinButton"
import { LookingForChips } from "@/components/LookingForChips"
import { TypeBadge } from "@/components/TypeBadge"
import { Text, View, useTheme } from "@/components/Themed"
import { useActivityPreview } from "@/hooks/use-activity-preview"
import { useMemberships } from "@/hooks/use-memberships"
import { formatActivityWhen, formatHeadcount, formatJoinPolicy, formatLocation } from "@/lib/format"

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")
const TARGET_W = Math.min(SCREEN_W - 28, 420)
const TARGET_H = Math.min(SCREEN_H * 0.8, 680)
const TARGET_X = (SCREEN_W - TARGET_W) / 2
const TARGET_Y = (SCREEN_H - TARGET_H) / 2
const OPEN = { duration: 360, easing: Easing.bezier(0.22, 1, 0.36, 1) }
const CLOSE = { duration: 240, easing: Easing.bezier(0.4, 0, 0.2, 1) }

export function ActivityPreview() {
  const theme = useTheme()
  const { preview, close } = useActivityPreview()
  const { decorate } = useMemberships()
  const progress = useSharedValue(0)
  const ox = useSharedValue(TARGET_X)
  const oy = useSharedValue(TARGET_Y)
  const ow = useSharedValue(TARGET_W)
  const oh = useSharedValue(TARGET_H)

  useEffect(() => {
    if (!preview) return
    const { x, y, width, height } = preview.origin
    ox.value = width > 8 ? x : TARGET_X
    oy.value = height > 8 ? y : TARGET_Y
    ow.value = width > 8 ? width : TARGET_W * 0.9
    oh.value = height > 8 ? height : TARGET_H * 0.9
    progress.value = 0
    progress.value = withTiming(1, OPEN)
  }, [oh, ow, ox, oy, preview, progress])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }))

  const cardStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: interpolate(progress.value, [0, 1], [ox.value, TARGET_X]),
    top: interpolate(progress.value, [0, 1], [oy.value, TARGET_Y]),
    width: interpolate(progress.value, [0, 1], [ow.value, TARGET_W]),
    height: interpolate(progress.value, [0, 1], [oh.value, TARGET_H]),
    opacity: interpolate(progress.value, [0, 0.12, 1], [0, 1, 1]),
  }))

  if (!preview) return null

  const activity = preview.activity
  const viewed = decorate(activity)

  function dismiss() {
    progress.value = withTiming(0, CLOSE, (finished) => {
      if (finished) runOnJS(close)()
    })
  }

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <RNView style={styles.layer}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.fill} onPress={dismiss}>
            <BlurView
              intensity={55}
              tint="default"
              blurMethod="dimezisBlurView"
              style={styles.fill}
            />
          </Pressable>
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: "#16181c", borderColor: theme.border },
            cardStyle,
          ]}
        >
          <Pressable onPress={dismiss} style={styles.close} hitSlop={12} accessibilityLabel="Close">
            <SymbolView
              name={{ ios: "xmark", android: "close", web: "close" }}
              tintColor={theme.foreground}
              size={18}
            />
          </Pressable>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.byline}>
              <Avatar name={activity.creatorName} src={activity.creatorAvatar} size={44} />
              <View style={styles.bylineText}>
                <Text style={styles.creator}>{activity.creatorName}</Text>
                <TypeBadge type={activity.type} />
              </View>
            </View>
            <Text style={styles.title}>{activity.title}</Text>
            <Text style={styles.body}>{activity.description}</Text>
            {activity.lookingFor.length > 0 ? (
              <LookingForChips items={activity.lookingFor} limit={8} />
            ) : null}
            <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
              {formatLocation(viewed)}
            </Text>
            <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
              {formatActivityWhen(viewed)}
            </Text>
            <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
              {formatHeadcount(viewed)} · {formatJoinPolicy(viewed.joinPolicy)}
            </Text>
            <ActivityCover activity={activity} compact={false} />
          </ScrollView>
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <JoinButton activity={activity} wide />
          </View>
        </Animated.View>
      </RNView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  layer: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    zIndex: 2,
    elevation: 24,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  close: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22,24,28,0.85)",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 10,
  },
  byline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "transparent",
  },
  bylineText: {
    gap: 6,
    backgroundColor: "transparent",
  },
  creator: {
    fontSize: 16,
    fontWeight: "700",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    fontSize: 14,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
  },
})
