import { useEffect, useState } from "react"
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View as RNView } from "react-native"
import { SymbolView } from "expo-symbols"
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg"
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
const OPEN = { duration: 400, easing: Easing.bezier(0.16, 1, 0.3, 1) }
const CLOSE = { duration: 320, easing: Easing.bezier(0.4, 0, 0.2, 1) }
const SHEET_BG = "#16181c"
const FADE_H = 72

export function ActivityPreview() {
  const theme = useTheme()
  const { preview, close } = useActivityPreview()
  const { decorate } = useMemberships()
  const progress = useSharedValue(0)
  const fromX = useSharedValue(0)
  const fromY = useSharedValue(0)
  const [fadeW, setFadeW] = useState(TARGET_W)
  const [footerH, setFooterH] = useState(70)

  useEffect(() => {
    if (!preview) return
    const { x, y, width, height } = preview.origin
    if (width > 8 && height > 8) {
      fromX.value = x + width / 2 - (TARGET_X + TARGET_W / 2)
      fromY.value = y + height / 2 - (TARGET_Y + TARGET_H / 2)
    } else {
      fromX.value = 0
      fromY.value = 40
    }
    progress.value = 0
    progress.value = withTiming(1, OPEN)
  }, [fromX, fromY, preview, progress])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }))

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [fromX.value, 0]) },
      { translateY: interpolate(progress.value, [0, 1], [fromY.value, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.88, 1]) },
    ],
    opacity: interpolate(progress.value, [0, 0.45, 1], [0, 1, 1]),
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
            <RNView style={styles.dim} pointerEvents="none" />
          </Pressable>
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: SHEET_BG, borderColor: theme.border },
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
          <RNView style={styles.column}>
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
          </RNView>
          <RNView
            style={styles.footer}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout
              const nextW = Math.round(width)
              const nextH = Math.round(height)
              if (nextW > 0 && nextW !== fadeW) setFadeW(nextW)
              if (nextH > 0 && nextH !== footerH) setFooterH(nextH)
            }}
          >
            <JoinButton activity={activity} wide />
          </RNView>
          <RNView pointerEvents="none" style={[styles.fade, { bottom: footerH - 1 }]}>
            <Svg width={fadeW} height={FADE_H}>
              <Defs>
                <LinearGradient id="sheetFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={SHEET_BG} stopOpacity="0" />
                  <Stop offset="0.55" stopColor={SHEET_BG} stopOpacity="0.75" />
                  <Stop offset="1" stopColor={SHEET_BG} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={fadeW} height={FADE_H} fill="url(#sheetFade)" />
            </Svg>
          </RNView>
        </Animated.View>
      </RNView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  layer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  dim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    width: TARGET_W,
    height: TARGET_H,
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
  column: {
    flex: 1,
    backgroundColor: SHEET_BG,
  },
  scroll: {
    flex: 1,
    backgroundColor: SHEET_BG,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 10,
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: FADE_H,
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
    zIndex: 2,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: SHEET_BG,
  },
})
