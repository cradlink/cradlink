import { LinearGradient } from "expo-linear-gradient"
import { StyleSheet } from "react-native"

export const GLASS_FROST = "rgba(16,18,22,0.44)"
export const GLASS_FADE_H = 72

export function GlassFade({
  height = GLASS_FADE_H,
  inset = true,
  reverse = false,
}: {
  height?: number
  inset?: boolean
  reverse?: boolean
}) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={
        reverse
          ? ["rgba(16,18,22,0.44)", "rgba(16,18,22,0.28)", "rgba(16,18,22,0)"]
          : ["rgba(16,18,22,0)", "rgba(16,18,22,0.28)", "rgba(16,18,22,0.44)"]
      }
      locations={[0, 0.55, 1]}
      style={[styles.fade, inset ? { top: -height, height } : { top: 0, height }]}
    />
  )
}

const styles = StyleSheet.create({
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1,
  },
})
