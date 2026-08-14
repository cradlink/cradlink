import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from "react-native"
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"

import { useTheme } from "@/components/Themed"
import { usePullRefresh, useReloadAll } from "@/hooks/use-refresh"

const { width: SCREEN_W } = Dimensions.get("window")
const BAR_W = 88

type RefreshState = {
  generation: number
  refreshing: boolean
}

const RefreshCtx = createContext<RefreshState>({ generation: 0, refreshing: false })

export function Refreshable({
  children,
  contentContainerStyle,
  ...props
}: Omit<ScrollViewProps, "refreshControl" | "children"> & { children: ReactNode }) {
  const theme = useTheme()
  const load = useReloadAll()
  const { refreshing, generation, refresh } = usePullRefresh(load)
  const conceal = useSharedValue(1)

  useEffect(() => {
    conceal.value = refreshing ? withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) }) : 1
  }, [conceal, refreshing])

  const concealStyle = useAnimatedStyle(() => ({
    opacity: conceal.value,
  }))

  return (
    <RefreshCtx.Provider value={{ generation, refreshing }}>
      <View style={styles.wrap}>
        <LoadingBar visible={refreshing} />
        <ScrollView
          overScrollMode="always"
          {...props}
          contentContainerStyle={contentContainerStyle}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void refresh()
              }}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.card}
            />
          }
        >
          <Animated.View style={concealStyle}>{children}</Animated.View>
        </ScrollView>
      </View>
    </RefreshCtx.Provider>
  )
}

export function Stagger({ children }: { children: ReactNode }) {
  const { generation, refreshing } = useContext(RefreshCtx)
  const items = Children.toArray(children)
  const [count, setCount] = useState(items.length)
  const prevGen = useRef(generation)

  useEffect(() => {
    if (!refreshing) return
    const timer = setTimeout(() => setCount(0), 150)
    return () => clearTimeout(timer)
  }, [refreshing])

  useEffect(() => {
    const genChanged = generation !== prevGen.current
    prevGen.current = generation

    if (generation === 0 || !genChanged) {
      setCount(items.length)
      return
    }

    setCount(0)
    const total = items.length
    if (total === 0) return
    let next = 0
    const timer = setInterval(() => {
      next += 1
      setCount(next)
      if (next >= total) clearInterval(timer)
    }, 64)
    return () => clearInterval(timer)
  }, [generation, items.length])

  return (
    <>
      {items.slice(0, count).map((child, index) => (
        <Reveal
          key={isValidElement(child) && child.key != null ? String(child.key) : String(index)}
          play={generation > 0}
        >
          {child}
        </Reveal>
      ))}
    </>
  )
}

function Reveal({ play, children }: { play: boolean; children: ReactNode }) {
  const opacity = useSharedValue(play ? 0 : 1)
  const y = useSharedValue(play ? 14 : 0)

  useEffect(() => {
    if (!play) return
    opacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    y.value = withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) })
  }, [opacity, play, y])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }))

  return <Animated.View style={[styles.reveal, style]}>{children}</Animated.View>
}

function LoadingBar({ visible }: { visible: boolean }) {
  const theme = useTheme()
  const progress = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 140 })
      progress.value = 0
      progress.value = withRepeat(withTiming(1, { duration: 880, easing: Easing.inOut(Easing.cubic) }), -1, false)
    } else {
      cancelAnimation(progress)
      opacity.value = withTiming(0, { duration: 200 })
    }
  }, [opacity, progress, visible])

  const bar = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-BAR_W, SCREEN_W]) }],
  }))

  return (
    <View pointerEvents="none" style={styles.track}>
      <Animated.View style={[styles.bar, { backgroundColor: theme.primary }, bar]} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  track: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 8,
    overflow: "hidden",
  },
  bar: {
    width: BAR_W,
    height: 2,
    borderRadius: 1,
  },
  reveal: {
    alignSelf: "stretch",
    width: "100%",
  },
})
