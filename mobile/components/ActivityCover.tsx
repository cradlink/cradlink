import { Image, StyleSheet, View } from "react-native"

import { useTheme } from "@/components/Themed"
import { resolveActivityBanner } from "@/lib/banners"
import type { Activity } from "@/lib/types"

export function ActivityCover({
  activity,
  compact = true,
}: {
  activity: Pick<Activity, "type" | "images" | "title">
  compact?: boolean
}) {
  const theme = useTheme()

  return (
    <View
      collapsable={false}
      style={[
        styles.frame,
        compact ? styles.compact : styles.expanded,
        { borderColor: theme.border, backgroundColor: theme.background },
      ]}
    >
      <Image
        source={resolveActivityBanner(activity)}
        accessibilityLabel={activity.title}
        resizeMode="cover"
        style={styles.image}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: "stretch",
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  compact: {
    height: 168,
  },
  expanded: {
    height: 220,
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
})
