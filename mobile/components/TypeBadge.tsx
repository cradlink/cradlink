import { StyleSheet } from "react-native"

import { Text, View } from "@/components/Themed"
import { ACTIVITY_META } from "@/lib/activity-meta"
import type { ActivityType } from "@/lib/types"

export function TypeBadge({ type }: { type: ActivityType }) {
  const meta = ACTIVITY_META[type]
  return <MetaPill label={meta.label} color={meta.color} />
}

export function MetaPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1a` }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    height: 20,
    borderRadius: 999,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
})
