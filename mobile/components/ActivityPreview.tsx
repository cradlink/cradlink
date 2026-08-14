import { useEffect, useMemo, useRef } from "react"
import {
  BackHandler,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View as RNView,
} from "react-native"
import { BlurView } from "expo-blur"
import { SymbolView } from "expo-symbols"
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

import { ConfirmModalHost } from "@/components/ConfirmDialog"
import { ActivityCover } from "@/components/ActivityCover"
import { GLASS_FROST, GlassFade } from "@/components/GlassFade"
import { Avatar } from "@/components/Avatar"
import { CreatorPress } from "@/components/CreatorPress"
import { JoinButton } from "@/components/JoinButton"
import { LookingForChips } from "@/components/LookingForChips"
import { RequestList } from "@/components/RequestList"
import { TypeBadge } from "@/components/TypeBadge"
import { Text, View, useTheme } from "@/components/Themed"
import { useActivityPreview } from "@/hooks/use-activity-preview"
import { useBlurTarget } from "@/hooks/use-blur-target"
import { useConfirm } from "@/hooks/use-confirm"
import { useI18n } from "@/hooks/use-i18n"
import { useMemberships } from "@/hooks/use-memberships"
import { formatActivityWhen, formatHeadcount, formatJoinPolicy, formatLocation } from "@/lib/format"

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")
const TARGET_W = Math.min(SCREEN_W - 28, 420)
const TARGET_H = Math.min(SCREEN_H * 0.8, 680)
const TARGET_X = (SCREEN_W - TARGET_W) / 2
const TARGET_Y = (SCREEN_H - TARGET_H) / 2
const OPEN = { duration: 400, easing: Easing.bezier(0.16, 1, 0.3, 1) }
const CLOSE = { duration: 320, easing: Easing.bezier(0.4, 0, 0.2, 1) }


export function ActivityPreview() {
  const theme = useTheme()
  const { preview, close, registerCloser, hidden } = useActivityPreview()
  const { prompt, dismiss: dismissConfirm } = useConfirm()
  const { messages } = useI18n()
  const wasAway = useRef(false)
  const scrollOffset = useRef(0)
  const { decorate } = useMemberships()
  const blurTarget = useBlurTarget()
  const progress = useSharedValue(0)
  const dragY = useSharedValue(0)
  const fromX = useSharedValue(0)
  const fromY = useSharedValue(0)
  const closing = useRef(false)

  function finishClose() {
    closing.current = false
    close()
  }

  function dismiss() {
    if (closing.current) return
    closing.current = true
    progress.value = withTiming(0, CLOSE, (finished) => {
      if (finished) runOnJS(finishClose)()
    })
  }

  function requestClose() {
    if (prompt) {
      dismissConfirm()
      return
    }
    dismiss()
  }

  useEffect(() => {
    registerCloser(dismiss)
    return () => registerCloser(null)
  })

  useEffect(() => {
    if (!preview || hidden) return
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      requestClose()
      return true
    })
    return () => sub.remove()
  }, [hidden, preview, prompt])

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
    closing.current = false
    dragY.value = 0
    progress.value = 0
    progress.value = withTiming(1, OPEN)
  }, [dragY, fromX, fromY, preview?.activity.id, preview?.origin.x, preview?.origin.y, progress])

  useEffect(() => {
    if (hidden) {
      wasAway.current = true
      return
    }
    if (wasAway.current && preview) {
      progress.value = 1
      wasAway.current = false
    }
  }, [hidden, preview, progress])

  const fade = useAnimatedStyle(() => ({
    opacity: progress.value * interpolate(dragY.value, [0, 240], [1, 0.2], Extrapolation.CLAMP),
  }))

  const glassAmount = () =>
    progress.value * interpolate(dragY.value, [0, 240], [1, 0.15], Extrapolation.CLAMP)

  const glassProps = useAnimatedProps(() => ({
    intensity: interpolate(glassAmount(), [0, 1], [1, 56]),
  }))

  const veilProps = useAnimatedProps(() => ({
    intensity: interpolate(glassAmount(), [0, 1], [1, 12]),
  }))

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [fromX.value, 0]) },
      { translateY: interpolate(progress.value, [0, 1], [fromY.value, 0]) + dragY.value },
      { scale: interpolate(progress.value, [0, 1], [0.92, 1]) },
    ],
  }))

  const sheetPan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          scrollOffset.current <= 2 && gesture.dy > 12 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          dragY.value = Math.max(0, gesture.dy)
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 80 || gesture.vy > 1.1) {
            dismiss()
            return
          }
          dragY.value = withTiming(0, { duration: 200 })
        },
        onPanResponderTerminate: () => {
          dragY.value = withTiming(0, { duration: 200 })
        },
      }),
    [dragY],
  )

  if (!preview) return null

  const activity = preview.activity
  const viewed = decorate(activity)

  return (
    <Modal
      visible={!hidden}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={requestClose}
    >
    <RNView style={styles.layer} pointerEvents="auto" collapsable={false}>
      <Animated.View style={[styles.backdrop, fade]} pointerEvents="auto">
        <Pressable
          style={styles.fill}
          onPress={dismiss}
          onMoveShouldSetResponder={() => true}
          onResponderRelease={dismiss}
        >
          {Platform.OS === "ios" ? (
            <AnimatedBlurView
              animatedProps={veilProps}
              tint="systemThinMaterialDark"
              style={styles.fill}
            />
          ) : null}
          <RNView style={styles.dim} pointerEvents="none" />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { borderColor: "rgba(231,233,234,0.14)" }, cardStyle]}
        pointerEvents="auto"
        {...sheetPan.panHandlers}
      >
        <AnimatedBlurView
          animatedProps={glassProps}
          tint="systemThinMaterialDark"
          blurMethod={blurTarget ? "dimezisBlurView" : "none"}
          blurTarget={blurTarget ?? undefined}
          blurReductionFactor={2}
          style={styles.glass}
        />
        <Animated.View style={[styles.frost, { backgroundColor: GLASS_FROST }, fade]} pointerEvents="none" />
        <RNView style={styles.handleWrap} {...sheetPan.panHandlers}>
          <RNView style={styles.handle} />
        </RNView>
        <Pressable onPress={dismiss} style={styles.close} hitSlop={20} accessibilityLabel={messages.common.close}>
          <SymbolView
            name={{ ios: "xmark", android: "close", web: "close" }}
            tintColor={theme.foreground}
            size={18}
          />
        </Pressable>
        <Animated.View style={[styles.column, fade]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            scrollOffset.current = event.nativeEvent.contentOffset.y
          }}
          scrollEventThrottle={16}
        >
            <View style={styles.byline}>
              <CreatorPress userId={activity.creatorId}>
                <Avatar name={activity.creatorName} src={activity.creatorAvatar} size={44} />
              </CreatorPress>
              <View style={styles.bylineText}>
                <CreatorPress userId={activity.creatorId}>
                  <Text style={styles.creator}>{activity.creatorName}</Text>
                </CreatorPress>
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
          </Animated.View>
          <Animated.View style={[styles.footer, fade]}>
            <GlassFade />
            <RequestList activity={activity} compact />
            <JoinButton activity={activity} wide />
          </Animated.View>
      </Animated.View>
      <ConfirmModalHost />
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
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  sheet: {
    width: TARGET_W,
    height: TARGET_H,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  glass: {
    ...StyleSheet.absoluteFill,
  },
  frost: {
    ...StyleSheet.absoluteFill,
  },
  handleWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 48,
    height: 40,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(231,233,234,0.28)",
  },
  close: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 3,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  column: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    padding: 20,
    paddingTop: 32,
    paddingBottom: 28,
    gap: 10,
  },
  byline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "transparent",
  },
  bylineText: {
    flexShrink: 1,
    gap: 6,
    backgroundColor: "transparent",
    alignItems: "flex-start",
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
    overflow: "visible",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: "transparent",
  },
})
