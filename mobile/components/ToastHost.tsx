import { useEffect, useState } from "react"
import { StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"

import { Text } from "@/components/Themed"
import { useToast, type ToastMessage } from "@/hooks/use-toast"

const IN = { duration: 280, easing: Easing.bezier(0.16, 1, 0.3, 1) }
const OUT = { duration: 220, easing: Easing.bezier(0.4, 0, 0.2, 1) }

export function ToastHost() {
  const { toast } = useToast()
  const insets = useSafeAreaInsets()
  const progress = useSharedValue(0)
  const [shown, setShown] = useState<ToastMessage | null>(null)

  useEffect(() => {
    if (toast) setShown(toast)
    progress.value = withTiming(toast ? 1 : 0, toast ? IN : OUT)
  }, [progress, toast])

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -18 }],
  }))

  if (!shown) return null

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + 18 }, style]}
    >
      <Text style={styles.title}>{shown.title}</Text>
      {shown.body ? (
        <Text style={styles.body} numberOfLines={2}>
          {shown.body}
        </Text>
      ) : null}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 80,
    elevation: 80,
    backgroundColor: "#202327",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    lineHeight: 18,
    color: "#8b9198",
  },
})
