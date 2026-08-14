import { useEffect, useMemo, useRef, useState } from "react"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { Text, useTheme } from "@/components/Themed"

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]
const ROW = 58
const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
const SLIDE = 640
const OPEN = { duration: 320, easing: Easing.bezier(0.16, 1, 0.3, 1) }
const CLOSE = { duration: 260, easing: Easing.bezier(0.4, 0, 0.2, 1) }

function startOfDay(d: Date) {
  const next = new Date(d)
  next.setHours(0, 0, 0, 0)
  return next
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function mondayIndex(d: Date) {
  return (d.getDay() + 6) % 7
}

function buildMonth(from: Date) {
  const today = startOfDay(new Date())
  const first = new Date(from.getFullYear(), from.getMonth(), 1)
  const lead = mondayIndex(first)
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null)
  const last = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate()
  for (let day = 1; day <= last; day++) {
    cells.push(new Date(from.getFullYear(), from.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return { today, cells }
}

function nearestMinute(n: number) {
  return MINUTES.reduce((best, m) => (Math.abs(m - n) < Math.abs(best - n) ? m : best), 0)
}

function WheelItem({
  label,
  i,
  scrollY,
  color,
}: {
  label: string
  i: number
  scrollY: SharedValue<number>
  color: string
}) {
  const style = useAnimatedStyle(() => {
    const dist = Math.abs(i - scrollY.value / ROW)
    return {
      opacity: interpolate(dist, [0, 0.55, 1, 1.7], [1, 0.42, 0.16, 0], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(dist, [0, 1, 1.7], [1, 0.84, 0.7], Extrapolation.CLAMP) }],
    }
  })
  return (
    <View style={styles.wheelRow}>
      <Animated.Text style={[styles.wheelText, { color }, style]}>{label}</Animated.Text>
    </View>
  )
}

function Wheel({
  items,
  index,
  onChange,
}: {
  items: string[]
  index: number
  onChange: (i: number) => void
}) {
  const theme = useTheme()
  const ref = useRef<Animated.ScrollView>(null)
  const scrollY = useSharedValue(index * ROW)

  useEffect(() => {
    scrollY.value = index * ROW
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: index * ROW, animated: false })
    }, 0)
    return () => clearTimeout(t)
  }, [index, scrollY])

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y
    },
  })

  function commit(y: number) {
    const i = Math.max(0, Math.min(items.length - 1, Math.round(y / ROW)))
    onChange(i)
  }

  return (
    <View style={styles.wheel}>
      <View pointerEvents="none" style={[styles.wheelMark, { borderColor: theme.border }]} />
      <Animated.ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={(e) => commit(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => commit(e.nativeEvent.contentOffset.y)}
      >
        <View style={{ height: ROW }} />
        {items.map((item, i) => (
          <WheelItem key={item} label={item} i={i} scrollY={scrollY} color={theme.foreground} />
        ))}
        <View style={{ height: ROW }} />
      </Animated.ScrollView>
      <LinearGradient
        pointerEvents="none"
        colors={["#16181c", "rgba(22,24,28,0)"]}
        style={styles.fadeTop}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(22,24,28,0)", "#16181c"]}
        style={styles.fadeBot}
      />
    </View>
  )
}

export function WhenSheet({
  visible,
  value,
  onDone,
  onClose,
}: {
  visible: boolean
  value: Date | null
  onDone: (next: Date) => void
  onClose: () => void
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [cursor, setCursor] = useState(() => startOfDay(new Date()))
  const [selected, setSelected] = useState(() => startOfDay(value ?? new Date()))
  const [hour, setHour] = useState(18)
  const [minute, setMinute] = useState(0)
  const { today, cells } = useMemo(() => buildMonth(cursor), [cursor])
  const startY = useRef(0)
  const [shown, setShown] = useState(visible)
  const progress = useSharedValue(0)
  const dragY = useSharedValue(0)

  function syncFrom(next: Date | null) {
    const base = next ?? new Date()
    setCursor(startOfDay(new Date(base.getFullYear(), base.getMonth(), 1)))
    setSelected(startOfDay(base))
    setHour(Math.min(23, Math.max(0, base.getHours())))
    setMinute(nearestMinute(base.getMinutes()))
  }

  function hide() {
    setShown(false)
    dragY.value = 0
  }

  function dismiss() {
    dragY.value = withTiming(0, { duration: 80 })
    progress.value = withTiming(0, CLOSE, (done) => {
      if (done) runOnJS(hide)()
    })
    onClose()
  }

  function confirm() {
    const next = new Date(selected)
    next.setHours(hour, minute, 0, 0)
    progress.value = withTiming(0, CLOSE, (done) => {
      if (done) runOnJS(hide)()
    })
    onDone(next)
  }

  useEffect(() => {
    if (visible) {
      setShown(true)
      syncFrom(value)
      dragY.value = 0
      progress.value = 0
      progress.value = withTiming(1, OPEN)
    } else if (shown) {
      progress.value = withTiming(0, CLOSE, (done) => {
        if (done) runOnJS(hide)()
      })
    }
  }, [visible])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]) * interpolate(dragY.value, [0, 240], [1, 0.35], Extrapolation.CLAMP),
  }))

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [SLIDE, 0]) + Math.max(0, dragY.value) }],
  }))

  const title = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  if (!shown) return null

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.dismiss, backdropStyle]}>
        <Pressable style={styles.fill} onPress={dismiss} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, 16), borderColor: theme.border },
          sheetStyle,
        ]}
      >
        <View
          style={styles.grab}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            startY.current = e.nativeEvent.pageY
          }}
          onResponderMove={(e) => {
            const dy = e.nativeEvent.pageY - startY.current
            dragY.value = dy > 0 ? dy : 0
          }}
          onResponderRelease={(e) => {
            const dy = e.nativeEvent.pageY - startY.current
            if (dy > 56) dismiss()
            else dragY.value = withTiming(0, { duration: 180 })
          }}
        >
          <View style={styles.grabBar} />
          <View style={styles.head}>
            <Pressable
              onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              hitSlop={12}
              style={styles.nav}
            >
              <Text style={styles.navLabel}>‹</Text>
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              hitSlop={12}
              style={styles.nav}
            >
              <Text style={styles.navLabel}>›</Text>
            </Pressable>
          </View>
        </View>

          <View style={styles.week}>
            {WEEK.map((d) => (
              <Text key={d} style={styles.weekDay} lightColor="#536471" darkColor="#71767b">
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((cell, i) => {
              if (!cell) return <View key={`e-${i}`} style={styles.cell} />
              const past = cell < today
              const on = sameDay(cell, selected)
              const isToday = sameDay(cell, today)
              return (
                <Pressable
                  key={cell.toISOString()}
                  disabled={past}
                  onPress={() => setSelected(cell)}
                  style={styles.cell}
                >
                  <View style={[styles.day, on && { backgroundColor: theme.foreground }]}>
                    <Text
                      style={[
                        styles.dayLabel,
                        {
                          color: past ? "#3d4146" : on ? theme.background : isToday ? theme.primary : theme.foreground,
                          fontWeight: on || isToday ? "800" : "500",
                        },
                      ]}
                    >
                      {cell.getDate()}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.clock}>
            <Wheel
              items={HOURS.map((h) => String(h).padStart(2, "0"))}
              index={Math.max(0, HOURS.indexOf(hour))}
              onChange={(i) => setHour(HOURS[i] ?? 0)}
            />
            <Text style={styles.colon}>:</Text>
            <Wheel
              items={MINUTES.map((m) => String(m).padStart(2, "0"))}
              index={Math.max(0, MINUTES.indexOf(minute))}
              onChange={(i) => setMinute(MINUTES[i] ?? 0)}
            />
          </View>

          <Pressable
            onPress={confirm}
            style={({ pressed }) => [styles.done, { backgroundColor: theme.foreground, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.doneLabel, { color: theme.background }]}>Done</Text>
          </Pressable>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    zIndex: 40,
  },
  dismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  fill: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#16181c",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 6,
    maxHeight: "88%",
  },
  grab: {
    alignItems: "center",
    paddingVertical: 8,
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3d4146",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
  },
  nav: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "400",
  },
  week: {
    flexDirection: "row",
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  day: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 15,
  },
  clock: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: ROW * 3,
  },
  colon: {
    width: 18,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
  },
  wheel: {
    width: 96,
    height: ROW * 3,
    overflow: "hidden",
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ROW + 4,
    zIndex: 2,
  },
  fadeBot: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ROW + 4,
    zIndex: 2,
  },
  wheelMark: {
    position: "absolute",
    left: 0,
    right: 0,
    top: ROW,
    height: ROW,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 1,
  },
  wheelRow: {
    height: ROW,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelText: {
    fontSize: 30,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  done: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  doneLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
})
