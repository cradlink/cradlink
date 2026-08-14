import { Text as DefaultText, View as DefaultView } from "react-native"

import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"

type ThemeProps = {
  lightColor?: string
  darkColor?: string
}

export type TextProps = ThemeProps & DefaultText["props"]
export type ViewProps = ThemeProps & DefaultView["props"]
export type ColorName = keyof typeof Colors.light & keyof typeof Colors.dark

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorName,
) {
  const theme = useColorScheme() ?? "light"
  const colorFromProps = props[theme]
  return colorFromProps ?? Colors[theme][colorName]
}

export function useTheme() {
  const scheme = useColorScheme() ?? "light"
  return Colors[scheme]
}

export function Text({ style, lightColor, darkColor, ...otherProps }: TextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "foreground")
  return <DefaultText style={[{ color }, style]} {...otherProps} />
}

export function View({ style, lightColor, darkColor, ...otherProps }: ViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, "background")
  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />
}
