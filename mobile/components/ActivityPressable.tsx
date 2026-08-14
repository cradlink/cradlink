import { useRef, type ReactNode } from "react"
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"

import { useTheme } from "@/components/Themed"
import { useActivityPreview } from "@/hooks/use-activity-preview"
import type { Activity } from "@/lib/types"

export function ActivityPressable({
  activity,
  children,
  style,
}: {
  activity: Activity
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const theme = useTheme()
  const { open } = useActivityPreview()
  const ref = useRef<View>(null)

  return (
    <View ref={ref} collapsable={false} style={styles.fill}>
      <Pressable
        onPress={() => {
          ref.current?.measureInWindow((x, y, width, height) => {
            open(activity, { x, y, width, height })
          })
        }}
        style={({ pressed }) => [style, { backgroundColor: pressed ? theme.hover : "transparent" }]}
      >
        {children}
      </Pressable>
    </View>
  )
}

export const listHairline = StyleSheet.hairlineWidth

const styles = StyleSheet.create({
  fill: {
    alignSelf: "stretch",
    width: "100%",
  },
})
