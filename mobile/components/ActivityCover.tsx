import { useState } from "react"
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
  const [width, setWidth] = useState(0)
  const maxHeight = compact ? 168 : 220
  const height = width > 0 ? Math.min(Math.round(width * (9 / 16)), maxHeight) : 0

  return (
    <View
      collapsable={false}
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width)
        if (next > 0 && next !== width) setWidth(next)
      }}
      style={styles.slot}
    >
      {width > 0 ? (
        <View
          collapsable={false}
          style={[
            styles.frame,
            {
              width,
              height,
              borderColor: theme.border,
              backgroundColor: theme.background,
            },
          ]}
        >
          <Image
            source={resolveActivityBanner(activity)}
            accessibilityLabel={activity.title}
            resizeMode="contain"
            style={{ width, height }}
          />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  slot: {
    alignSelf: "stretch",
    width: "100%",
  },
  frame: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
})
