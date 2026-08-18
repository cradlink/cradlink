import { Pressable, StyleSheet } from "react-native"

import { Text, View, useTheme } from "@/components/Themed"

export function UnderlineTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T
  onChange: (value: T) => void
  items: { value: T; label: string }[]
}) {
  const theme = useTheme()
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]} lightColor="transparent" darkColor="transparent">
      {items.map((item) => {
        const active = item.value === value
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={({ pressed }) => [styles.tab, { backgroundColor: pressed ? theme.hover : "transparent" }]}
          >
            <Text
              style={[styles.label, active && styles.labelOn]}
              lightColor={active ? theme.foreground : "#536471"}
              darkColor={active ? theme.foreground : "#71767b"}
            >
              {item.label}
            </Text>
            {active ? <View style={[styles.line, { backgroundColor: theme.primary }]} /> : null}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    paddingBottom: 12,
  },
  labelOn: {
    fontWeight: "800",
  },
  line: {
    height: 4,
    alignSelf: "stretch",
    marginHorizontal: 12,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
})
