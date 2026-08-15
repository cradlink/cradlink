import { type ReactNode } from "react"
import { StyleSheet, View } from "react-native"

export const THREAD_AVATAR = 36
const LINE_W = 2
export const THREAD_LINE = "rgba(113, 118, 123, 0.38)"

export function ThreadRail({ lineDown, children }: { lineDown?: boolean; children: ReactNode }) {
  return (
    <View style={styles.rail}>
      {lineDown ? <View pointerEvents="none" style={styles.line} /> : null}
      <View style={styles.dot}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  rail: {
    width: THREAD_AVATAR,
    alignSelf: "stretch",
    overflow: "visible",
  },
  dot: {
    width: THREAD_AVATAR,
    height: THREAD_AVATAR,
    zIndex: 1,
  },
  line: {
    position: "absolute",
    top: THREAD_AVATAR,
    bottom: 0,
    left: (THREAD_AVATAR - LINE_W) / 2,
    width: LINE_W,
    backgroundColor: THREAD_LINE,
  },
})
