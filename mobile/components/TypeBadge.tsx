import { StyleSheet } from "react-native"

import { Text, View } from "@/components/Themed"
import { useI18n } from "@/hooks/use-i18n"
import { ACTIVITY_META } from "@/lib/activity-meta"
import type { ActivityType } from "@/lib/types"

export function TypeBadge({ type }: { type: ActivityType }) {
  const { messages } = useI18n()
  return <MetaPill label={messages.types[type]} color={ACTIVITY_META[type].color} />
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
