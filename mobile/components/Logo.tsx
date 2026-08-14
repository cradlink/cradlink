import { StyleSheet } from "react-native"
import Svg, { Circle, Path } from "react-native-svg"

import { Text, View } from "@/components/Themed"
import { APP_NAME } from "@/constants/config"
import { useTheme } from "@/components/Themed"

export function Logo({ compact = false }: { compact?: boolean }) {
  const theme = useTheme()

  return (
    <View style={styles.row} lightColor="transparent" darkColor="transparent">
      <View style={[styles.mark, { backgroundColor: theme.foreground }]}>
        <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
          <Circle cx="8" cy="12" r="3.2" stroke={theme.background} strokeWidth="1.8" />
          <Circle cx="16" cy="12" r="3.2" stroke={theme.background} strokeWidth="1.8" />
          <Path d="M11 12h2" stroke={theme.background} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
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
  },
  wordmark: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
})
