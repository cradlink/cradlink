import { useEffect } from "react"
import { Modal, Pressable, StyleSheet, View } from "react-native"
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { Text, useTheme } from "@/components/Themed"

const OPEN = { duration: 220, easing: Easing.bezier(0.16, 1, 0.3, 1) }
const CLOSE = { duration: 180, easing: Easing.bezier(0.4, 0, 0.2, 1) }
const CARD = "#16181c"

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const theme = useTheme()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(1, OPEN)
  }, [progress])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }))

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.94, 1]) }],
  }))

  function finish(next: () => void) {
    progress.value = withTiming(0, CLOSE, (done) => {
      if (done) runOnJS(next)()
    })
  }

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => finish(onCancel)}>
      <View style={styles.layer}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.fill} onPress={() => finish(onCancel)} />
        </Animated.View>
        <Animated.View style={[styles.card, { borderColor: theme.border }, cardStyle]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body} lightColor="#536471" darkColor="#71767b">
            {body}
          </Text>
          <Pressable
            onPress={() => finish(onConfirm)}
            style={({ pressed }) => [
              styles.action,
              styles.firstAction,
              destructive
                ? { backgroundColor: "transparent", borderColor: theme.border }
                : { backgroundColor: theme.foreground, borderColor: theme.foreground },
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text
              style={[
                styles.actionLabel,
                { color: destructive ? "#f4212e" : theme.background },
              ]}
            >
              {confirmLabel}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => finish(onCancel)}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: "transparent", borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={styles.actionLabel}>{cancelLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  layer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  fill: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  card: {
    zIndex: 2,
    width: "100%",
    maxWidth: 340,
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
