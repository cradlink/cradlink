import { useEffect } from "react"
import { Dimensions, StyleSheet, View } from "react-native"
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated"

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")
const COLORS = ["#1d9bf0", "#ffd400", "#7856ff", "#00ba7c", "#f91880", "#ff7a00", "#e7e9ea"]
const COUNT = 28

const listeners = new Set<() => void>()

export function rainConfetti() {
  listeners.forEach((fn) => fn())
}

const PIECES = Array.from({ length: COUNT }, (_, i) => ({
  id: i,
  x: ((i * 53 + 11) % 100) / 100 * SCREEN_W,
  drift: (i % 2 === 0 ? 1 : -1) * (8 + (i % 6) * 5),
  rot: (i % 2 === 0 ? 1 : -1) * (160 + (i * 17) % 180),
  w: i % 4 === 0 ? 8 : 5,
  h: i % 4 === 0 ? 3.5 : 5,
  color: COLORS[i % COLORS.length],
  delay: (i % 8) * 28,
  duration: 1600 + (i % 6) * 90,
  fall: SCREEN_H * (0.5 + (i % 4) * 0.05),
}))

function Piece({
  spec,
  play,
}: {
  spec: (typeof PIECES)[number]
  play: SharedValue<number>
}) {
  const t = useSharedValue(0)

  useAnimatedReaction(
    () => play.value,
    (current, prev) => {
      if (current === 0 || current === prev) return
      cancelAnimation(t)
      t.value = 0
      t.value = withDelay(spec.delay, withTiming(1, { duration: spec.duration, easing: Easing.in(Easing.quad) }))
    },
  )

  const style = useAnimatedStyle(() => {
    const p = t.value
    if (p === 0) return { opacity: 0 }
    const fade = p < 0.74 ? 1 : 1 - (p - 0.74) / 0.26
    return {
      opacity: fade,
      transform: [
        { translateX: spec.x + spec.drift * p },
        { translateY: -12 + spec.fall * p },
        { rotate: `${spec.rot * p}deg` },
      ],
    }
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          width: spec.w,
          height: spec.h,
          borderRadius: spec.w === spec.h ? 99 : 1,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  )
}

export function ConfettiHost() {
  const play = useSharedValue(0)

  useEffect(() => {
    const bump = () => {
      play.value = play.value + 1
    }
    listeners.add(bump)
    return () => {
      listeners.delete(bump)
    }
  }, [play])

  return (
    <View pointerEvents="none" style={styles.layer}>
      {PIECES.map((spec) => (
        <Piece key={spec.id} spec={spec} play={play} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 80,
  },
  piece: {
    position: "absolute",
    top: 0,
    left: 0,
  },
})
