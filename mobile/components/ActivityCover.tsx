import { useEffect, useState } from "react"
import { Image, StyleSheet, View } from "react-native"

import { useTheme } from "@/components/Themed"
import { activityBannerSources } from "@/lib/banners"
import type { Activity } from "@/lib/types"

export function ActivityCover({
  activity,
  compact = true,
}: {
  activity: Pick<Activity, "type" | "images" | "title">
  compact?: boolean
}) {
  const theme = useTheme()
  const sources = activityBannerSources(activity)
  const [index, setIndex] = useState(0)
  useEffect(() => {
    setIndex(0)
  }, [activity.images[0], activity.type])
  const source = sources[Math.min(index, sources.length - 1)]

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
        source={source}
        accessibilityLabel={activity.title}
        resizeMode="cover"
        style={styles.image}
        onError={() => setIndex((current) => Math.min(current + 1, sources.length - 1))}
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
