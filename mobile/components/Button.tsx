import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native"

import { Text, useTheme } from "@/components/Themed"

export function Button({
  label,
  variant = "primary",
  style,
  disabled,
  ...props
}: {
  label: string
  variant?: "primary" | "ghost"
  style?: StyleProp<ViewStyle>
  disabled?: boolean
  onPress?: () => void
}) {
  const theme = useTheme()
  const primary = variant === "primary"

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: primary ? theme.primary : "transparent",
          opacity: pressed || disabled ? 0.7 : 1,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={[styles.label, { color: primary ? theme.primaryForeground : theme.foreground }]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
  },
})
