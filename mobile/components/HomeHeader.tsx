import { useEffect, useRef, useState } from "react"
import { Pressable, StyleSheet, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { Logo } from "@/components/Logo"
import { useTheme } from "@/components/Themed"

const EASE = Easing.out(Easing.cubic)
const DURATION = 240

export function HomeHeader({
  searchValue,
  onSearchChange,
}: {
  searchValue: string
  onSearchChange: (value: string) => void
}) {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const router = useRouter()
  const inputRef = useRef<TextInput>(null)
  const [open, setOpen] = useState(false)
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: DURATION, easing: EASE })
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(id)
    }
    inputRef.current?.blur()
  }, [open, progress])

  const logoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.92]) }],
  }))

  const sideStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6], [1, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.85]) }],
  }))

  const fieldStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.35, 1], [0, 1]),
  }))

  function closeSearch() {
    onSearchChange("")
    setOpen(false)
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top,
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Animated.View style={[styles.side, sideStyle]} pointerEvents={open ? "none" : "auto"}>
          <Pressable
            hitSlop={8}
            onPress={() => setOpen(true)}
            accessibilityLabel="Search"
            style={styles.iconBtn}
          >
            <SymbolView
              name={{ ios: "magnifyingglass", android: "search", web: "search" }}
              tintColor={theme.foreground}
              size={22}
            />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.center, logoStyle]} pointerEvents="none">
          <Logo compact iconSize={26} />
        </Animated.View>

        <Animated.View style={[styles.side, sideStyle]} pointerEvents={open ? "none" : "auto"}>
          <Pressable
            hitSlop={8}
            onPress={() => router.push("/settings")}
            accessibilityLabel="Settings"
            style={styles.iconBtn}
          >
            <SymbolView
              name={{ ios: "gearshape", android: "settings", web: "settings" }}
              tintColor={theme.foreground}
              size={22}
            />
          </Pressable>
        </Animated.View>

        <Animated.View
          pointerEvents={open ? "auto" : "none"}
          style={[styles.searchOverlay, fieldStyle]}
        >
          <Pressable onPress={closeSearch} style={styles.iconBtn} accessibilityLabel="Close search">
            <SymbolView
              name={{ ios: "xmark", android: "close", web: "close" }}
              tintColor={theme.foreground}
              size={20}
            />
          </Pressable>
          <View style={[styles.field, { backgroundColor: theme.muted }]}>
            <TextInput
              ref={inputRef}
              keyboardAppearance="dark"
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder="Search"
              placeholderTextColor={theme.mutedForeground}
              selectionColor={theme.primary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={[styles.input, { color: theme.foreground }]}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    height: 53,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  side: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchOverlay: {
    ...StyleSheet.absoluteFill,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 3,
  },
  field: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
})
