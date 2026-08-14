import { StyleSheet } from "react-native"

import { Text, View } from "@/components/Themed"
import { ACTIVITY_META } from "@/lib/activity-meta"
import type { ActivityType } from "@/lib/types"

export function TypeBadge({ type }: { type: ActivityType }) {
  const meta = ACTIVITY_META[type]
  return (
    <View style={[styles.badge, { backgroundColor: `${meta.color}1a` }]}>
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "transparent",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
})
