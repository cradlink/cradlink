import { Pressable, StyleSheet, View } from "react-native"
import { SymbolView } from "expo-symbols"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text, useTheme } from "@/components/Themed"
import { useI18n } from "@/hooks/use-i18n"

const ICONS = {
  index: {
    idle: { ios: "house", android: "home", web: "home" },
    active: { ios: "house.fill", android: "home", web: "home" },
  },
  upcoming: {
    idle: { ios: "calendar", android: "calendar_today", web: "calendar_today" },
    active: { ios: "calendar", android: "calendar_today", web: "calendar_today" },
  },
  me: {
    idle: { ios: "square.and.pencil", android: "edit", web: "edit" },
    active: { ios: "square.and.pencil", android: "edit", web: "edit" },
  },
  profile: {
    idle: { ios: "person", android: "person", web: "person" },
    active: { ios: "person.fill", android: "person", web: "person" },
  },
} as const

export function TabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const { messages } = useI18n()
  const labels = {
    index: messages.tabs.home,
    upcoming: messages.tabs.upcoming,
    me: messages.tabs.me,
    profile: messages.tabs.profile,
  } as const

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
        const icons = ICONS[route.name as keyof typeof ICONS]
        const meta = icons ?? {
          idle: { ios: "circle", android: "circle", web: "circle" } as const,
          active: { ios: "circle.fill", android: "circle", web: "circle" } as const,
        }
        const label = labels[route.name as keyof typeof labels] ?? options.title ?? route.name
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
            <Text
              numberOfLines={2}
              style={[styles.label, { color, fontWeight: focused ? "700" : "500" }]}
            >
              {label}
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
    fontSize: 10,
    letterSpacing: -0.2,
    textAlign: "center",
    paddingHorizontal: 2,
  },
})
