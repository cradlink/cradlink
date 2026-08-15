import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"
import { SvgXml } from "react-native-svg"

import { LOGO_ICON_SVG } from "@/components/logo-svg"
import { generatedColor, inkFor } from "@/lib/generated-art"

export function GeneratedArt({
  uri,
  iconSize,
  style,
}: {
  uri: string
  iconSize: number
  style?: StyleProp<ViewStyle>
}) {
  const bg = generatedColor(uri)
  return (
    <View style={[styles.fill, { backgroundColor: bg }, style]}>
      <SvgXml xml={LOGO_ICON_SVG} width={iconSize} height={iconSize} color={inkFor(bg)} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
})
