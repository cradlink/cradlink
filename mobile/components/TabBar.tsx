import { Pressable, StyleSheet, View } from "react-native"
import { SymbolView } from "expo-symbols"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text, useTheme } from "@/components/Themed"

const ICONS = {
  index: {
    label: "Home",
    idle: { ios: "house", android: "home", web: "home" },
    active: { ios: "house.fill", android: "home", web: "home" },
  },
  upcoming: {
    label: "Upcoming",
    idle: { ios: "calendar", android: "calendar_today", web: "calendar_today" },
    active: { ios: "calendar", android: "calendar_today", web: "calendar_today" },
  },
  me: {
    label: "Mine",
    idle: { ios: "square.and.pencil", android: "edit", web: "edit" },
    active: { ios: "square.and.pencil", android: "edit", web: "edit" },
  },
  profile: {
    label: "Profile",
    idle: { ios: "person", android: "person", web: "person" },
    active: { ios: "person.fill", android: "person", web: "person" },
  },
} as const

export function TabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets()
  const theme = useTheme()

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: "#000000",
          borderTopColor: theme.border,
        },
      ]}
    >
      {state.routes.map((route: { key: string; name: string; params?: object }, index: number) => {
        const options = descriptors[route.key].options
        const focused = state.index === index
        const meta = ICONS[route.name as keyof typeof ICONS] ?? {
          label: options.title ?? route.name,
          idle: { ios: "circle", android: "circle", web: "circle" } as const,
          active: { ios: "circle.fill", android: "circle", web: "circle" } as const,
        }
        const color = focused ? theme.foreground : theme.mutedForeground

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              })
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params)
              }
            }}
            style={styles.item}
          >
            <SymbolView
              name={focused ? meta.active : meta.idle}
              tintColor={color}
              size={26}
            />
            <Text style={[styles.label, { color, fontWeight: focused ? "700" : "500" }]}>
              {meta.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: 44,
  },
  label: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
})
