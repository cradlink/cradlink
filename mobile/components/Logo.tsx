import { StyleSheet } from "react-native"

import { Text, View, useTheme } from "@/components/Themed"
import { APP_NAME } from "@/constants/config"

export function Logo({ compact = false }: { compact?: boolean }) {
  const theme = useTheme()

  return (
    <View style={styles.row} lightColor="transparent" darkColor="transparent">
      <View style={[styles.mark, { backgroundColor: theme.foreground }]}>
        <View style={[styles.node, { borderColor: theme.background }]} />
        <View style={[styles.link, { backgroundColor: theme.background }]} />
        <View style={[styles.node, { borderColor: theme.background }]} />
      </View>
      {compact ? null : <Text style={styles.wordmark}>{APP_NAME}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  mark: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 2,
  },
  node: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.6,
    backgroundColor: "transparent",
  },
  link: {
    width: 4,
    height: 1.6,
    borderRadius: 1,
  },
  wordmark: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
})
