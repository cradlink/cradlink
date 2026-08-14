import { View, type StyleProp, type ViewStyle } from "react-native"

export function ScreenBlurTarget({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return <View style={[{ flex: 1 }, style]}>{children}</View>
}
