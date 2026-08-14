import { useEffect } from "react"
import { Dimensions, Modal, Pressable, StyleSheet, View } from "react-native"
import { BlurView } from "expo-blur"
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { Text, useTheme } from "@/components/Themed"
import { useConfirm } from "@/hooks/use-confirm"
import { useI18n } from "@/hooks/use-i18n"

const OPEN = { duration: 220, easing: Easing.bezier(0.16, 1, 0.3, 1) }
const CLOSE = { duration: 180, easing: Easing.bezier(0.4, 0, 0.2, 1) }
const CARD = "#16181c"
const { width: SCREEN_W } = Dimensions.get("window")
const CARD_W = Math.min(SCREEN_W - 56, 340)

export function ConfirmModalHost() {
  const { prompt, dismiss } = useConfirm()
  const theme = useTheme()
  const { messages } = useI18n()
  const progress = useSharedValue(0)

  useEffect(() => {
    if (!prompt) {
      progress.value = 0
      return
    }
    progress.value = 0
    progress.value = withTiming(1, OPEN)
  }, [progress, prompt])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }))

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.94, 1]) }],
  }))

  if (!prompt) return null
  const current = prompt

  function finish(next: () => void) {
    progress.value = withTiming(0, CLOSE, (done) => {
      if (done) runOnJS(next)()
    })
  }

  function confirm() {
    const action = current.onConfirm
    finish(() => {
      action()
      dismiss()
    })
  }

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.screen} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.fill} onPress={() => finish(dismiss)}>
            <BlurView intensity={48} tint="dark" blurMethod="none" style={styles.fill} />
            <View style={styles.dim} pointerEvents="none" />
          </Pressable>
        </Animated.View>
        <Animated.View
          style={[styles.card, { borderColor: theme.border }, cardStyle]}
          pointerEvents="auto"
        >
          <Text style={styles.title}>{prompt.title}</Text>
          <Text style={styles.body} lightColor="#536471" darkColor="#71767b">
            {prompt.body}
          </Text>
          <Pressable
            onPress={confirm}
            style={({ pressed }) => [
              styles.action,
              styles.firstAction,
              prompt.destructive
                ? { backgroundColor: "transparent", borderColor: theme.border }
                : { backgroundColor: theme.foreground, borderColor: theme.foreground },
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text
              style={[
                styles.actionLabel,
                { color: prompt.destructive ? "#f4212e" : theme.background },
              ]}
            >
              {prompt.confirmLabel}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => finish(dismiss)}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: "transparent", borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={styles.actionLabel}>{prompt.cancelLabel ?? messages.common.cancel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: SCREEN_W,
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
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  card: {
    width: CARD_W,
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  body: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 20,
  },
  firstAction: {
    marginTop: 22,
  },
  action: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
})
