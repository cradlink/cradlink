import { StyleSheet, View } from "react-native"
import { SvgXml } from "react-native-svg"

import { useTheme } from "@/components/Themed"
import { LOGO_ICON_SVG, LOGO_WORDMARK_SVG } from "@/components/logo-svg"

export function Logo({
  compact = false,
  iconSize = 36,
}: {
  compact?: boolean
  iconSize?: number
}) {
  const theme = useTheme()
  const wordmarkHeight = Math.round(iconSize * 0.58)
  const wordmarkWidth = Math.round(wordmarkHeight * (218.823 / 46.141))

  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="Cradlink">
      <SvgXml xml={LOGO_ICON_SVG} width={iconSize} height={iconSize} color={theme.foreground} />
      {compact ? null : (
        <SvgXml
          xml={LOGO_WORDMARK_SVG}
          width={wordmarkWidth}
          height={wordmarkHeight}
          color={theme.foreground}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
})
