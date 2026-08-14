import { useEffect, useState } from "react"
import { StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"

import { Text } from "@/components/Themed"
import { useToast, type ToastMessage } from "@/hooks/use-toast"

const IN = { duration: 240, easing: Easing.bezier(0.16, 1, 0.3, 1) }
const OUT = { duration: 200, easing: Easing.bezier(0.4, 0, 0.2, 1) }
const TAB = 56

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
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }))

  if (!shown) return null

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.bar, { bottom: insets.bottom + TAB }, style]}
    >
      <Text style={styles.label} numberOfLines={1}>
        {shown.title}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 80,
    elevation: 80,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#1d1f23",
  },
  label: {
    color: "#e7e9ea",
    fontSize: 15,
    fontWeight: "500",
  },
})
