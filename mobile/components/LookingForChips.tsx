import { StyleSheet } from "react-native"

import { Text, View } from "@/components/Themed"

export function LookingForChips({ items, limit = 4 }: { items: string[]; limit?: number }) {
  const visible = items.slice(0, limit)
  const extra = items.length - visible.length
  if (visible.length === 0) return null

  return (
    <View style={styles.row}>
      {visible.map((item) => (
        <View key={item} style={styles.chip}>
          <Text style={styles.label}>{item}</Text>
        </View>
      ))}
      {extra > 0 ? (
        <View style={styles.chip}>
          <Text style={styles.extra}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    backgroundColor: "transparent",
  },
  chip: {
    borderRadius: 999,
    backgroundColor: "#1d9bf01a",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    color: "#1d9bf0",
  },
  extra: {
    fontSize: 12,
    color: "#71767b",
  },
})
