import { useEffect, useRef, useState } from "react"
import { StyleSheet } from "react-native"
import { SpaceGrotesk_500Medium, useFonts } from "@expo-google-fonts/space-grotesk"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated"

import { Logo } from "@/components/Logo"
import { ParticleField } from "@/components/ParticleField"
import { Text, View } from "@/components/Themed"
import { useFireflies } from "@/hooks/use-fireflies"

const WORD = "cradlink"
const STEP_MS = 120
const START_DELAY_MS = 280
const PAUSE_FULL_MS = 720
const PAUSE_EMPTY_MS = 320
const HOLD_MS = 420
const FADE_MS = 360

export function BootScreen({
  ready,
  onDone,
}: {
  ready: boolean
  onDone: () => void
}) {
  const [fontsLoaded] = useFonts({ SpaceGrotesk_500Medium })
  const { on: fireflies } = useFireflies()
  const [shown, setShown] = useState("")
  const readyRef = useRef(ready)
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)
  const opacity = useSharedValue(1)
  const caret = useSharedValue(1)
  readyRef.current = ready
  onDoneRef.current = onDone

  useEffect(() => {
    if (!fontsLoaded) return

    let i = 0
    let dir: 1 | -1 = 1
    let holding = false
    let nextAt = performance.now() + START_DELAY_MS
    let frame = 0

    function finish() {
      if (doneRef.current) return
      doneRef.current = true
      cancelAnimationFrame(frame)
      opacity.value = withTiming(0, { duration: FADE_MS, easing: Easing.out(Easing.quad) })
      setTimeout(() => onDoneRef.current(), FADE_MS)
    }

    function tick(now: number) {
      if (doneRef.current) return

      if (now >= nextAt) {
        if (holding) {
          finish()
          return
        }

        if (readyRef.current) {
          if (i < WORD.length) {
            i += 1
            setShown(WORD.slice(0, i))
            nextAt = now + STEP_MS
          } else {
            holding = true
            nextAt = now + HOLD_MS
          }
        } else {
          i += dir
          if (i >= WORD.length) {
            i = WORD.length
            setShown(WORD)
            dir = -1
            nextAt = now + PAUSE_FULL_MS
          } else if (i <= 0) {
            i = 0
            setShown("")
            dir = 1
            nextAt = now + PAUSE_EMPTY_MS
          } else {
            setShown(WORD.slice(0, i))
            nextAt = now + STEP_MS
          }
        }
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [fontsLoaded, opacity])

  useEffect(() => {
    caret.value = withRepeat(
      withTiming(0, { duration: 160, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    )
  }, [caret])

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }))
  const caretStyle = useAnimatedStyle(() => ({ opacity: caret.value }))

  return (
    <Animated.View style={[styles.screen, fade]}>
      {fireflies ? <ParticleField /> : null}
      <View style={styles.mark} lightColor="transparent" darkColor="transparent">
        <Logo compact iconSize={42} />
        <View style={styles.wordWrap} lightColor="transparent" darkColor="transparent">
          <Text style={[styles.word, fontsLoaded && styles.wordFont]}>{shown}</Text>
          <Animated.Text style={[styles.caret, fontsLoaded && styles.wordFont, caretStyle]}>|</Animated.Text>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    zIndex: 90,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  mark: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 10,
  },
  wordWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -2,
  },
  word: {
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -3.5,
    color: "#e7e9ea",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  wordFont: {
    fontFamily: "SpaceGrotesk_500Medium",
  },
  caret: {
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -3.5,
    color: "#1d9bf0",
    marginLeft: -2,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
})
