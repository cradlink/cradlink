import { useEffect } from "react"
import { Dimensions, StyleSheet } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: ((i * 73) % 100) / 100,
  y: ((i * 41 + 17) % 100) / 100,
  size: 1.4 + (i % 4) * 0.7,
  rise: 12000 + (i % 8) * 1400,
  drift: 12 + (i % 6) * 7,
  delay: (i * 180) % 2800,
  blue: i % 4 === 0,
}))

export function ParticleField() {
  return (
    <Animated.View pointerEvents="none" style={styles.field}>
      {PARTICLES.map((spec) => (
        <Particle key={spec.id} spec={spec} />
      ))}
    </Animated.View>
  )
}

function Particle({ spec }: { spec: (typeof PARTICLES)[number] }) {
  const lift = useSharedValue(0)
  const sway = useSharedValue(0)
  const glow = useSharedValue(0)

  useEffect(() => {
    lift.value = withDelay(
      spec.delay,
      withRepeat(withTiming(-SCREEN_H * 0.5, { duration: spec.rise, easing: Easing.linear }), -1, false),
    )
    sway.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(spec.drift * (spec.id % 2 === 0 ? 1 : -1), {
          duration: spec.rise * 0.55,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    )
    glow.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(spec.blue ? 0.42 : 0.28, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    )
  }, [glow, lift, spec, sway])

  const style = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ translateX: sway.value }, { translateY: lift.value }],
  }))

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          left: spec.x * SCREEN_W,
          top: spec.y * SCREEN_H,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: spec.blue ? "#1d9bf0" : "#e7e9ea",
        },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  field: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  dot: {
    position: "absolute",
  },
})
