import { type ReactNode } from "react"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

import { Text, useTheme } from "@/components/Themed"
import { useI18n } from "@/hooks/use-i18n"
import { ACTIVITY_META } from "@/lib/activity-meta"
import { ACTIVITY_TYPES, type ActivityType, type LocationType } from "@/lib/types"

const PLACE_VALUES: (LocationType | "all")[] = ["all", "online", "in-person", "hybrid"]

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
  const { messages } = useI18n()

  return (
    <View style={[styles.wrap, { borderBottomColor: theme.border }]}>
      <FadeScroller>
        <Chip label={messages.common.all} active={type === "all"} onPress={() => onType("all")} />
        {ACTIVITY_TYPES.map((value) => (
          <Chip
            key={value}
            label={messages.types[value]}
            color={ACTIVITY_META[value].color}
            active={type === value}
            onPress={() => onType(value)}
          />
        ))}
      </FadeScroller>
      <FadeScroller>
        {PLACE_VALUES.map((value) => (
          <Chip
            key={value}
            label={messages.places[value]}
            active={locationType === value}
            onPress={() => onLocation(value)}
          />
        ))}
      </FadeScroller>
    </View>
  )
}

function FadeScroller({ children }: { children: ReactNode }) {
  return (
    <View style={styles.scroller}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {children}
      </ScrollView>
      <LinearGradient
        pointerEvents="none"
        colors={["#000000", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fade, styles.fadeLeft]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "#000000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fade, styles.fadeRight]}
      />
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
  scroller: {
    position: "relative",
  },
  row: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  fade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 32,
  },
  fadeLeft: {
    left: 0,
  },
  fadeRight: {
    right: 0,
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
