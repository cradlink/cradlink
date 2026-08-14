import { Pressable, ScrollView, StyleSheet, View } from "react-native"

import { Text, useTheme } from "@/components/Themed"
import { ACTIVITY_META } from "@/lib/activity-meta"
import { ACTIVITY_TYPES, type ActivityType, type LocationType } from "@/lib/types"

const PLACES: { value: LocationType | "all"; label: string }[] = [
  { value: "all", label: "Any place" },
  { value: "online", label: "Online" },
  { value: "in-person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
]

export function FeedFilters({
  type,
  locationType,
  onType,
  onLocation,
}: {
  type: ActivityType | "all"
  locationType: LocationType | "all"
  onType: (value: ActivityType | "all") => void
  onLocation: (value: LocationType | "all") => void
}) {
  const theme = useTheme()

  return (
    <View style={[styles.wrap, { borderBottomColor: theme.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip label="All" active={type === "all"} onPress={() => onType("all")} />
        {ACTIVITY_TYPES.map((value) => (
          <Chip
            key={value}
            label={ACTIVITY_META[value].label}
            color={ACTIVITY_META[value].color}
            active={type === value}
            onPress={() => onType(value)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PLACES.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            active={locationType === item.value}
            onPress={() => onLocation(item.value)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

function Chip({
  label,
  active,
  onPress,
  color,
}: {
  label: string
  active: boolean
  onPress: () => void
  color?: string
}) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: active ? theme.foreground : theme.border,
          backgroundColor: active ? theme.foreground : "transparent",
        },
      ]}
    >
      {color && !active ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.chipLabel, { color: active ? theme.background : theme.mutedForeground }]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
})
