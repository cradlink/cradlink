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
  variant?: "primary" | "ink" | "outline" | "ghost"
  style?: StyleProp<ViewStyle>
  disabled?: boolean
  onPress?: () => void
}) {
  const theme = useTheme()

  const palette = {
    primary: {
      backgroundColor: theme.primary,
      color: theme.primaryForeground,
      borderColor: theme.primary,
    },
    ink: {
      backgroundColor: theme.foreground,
      color: theme.background,
      borderColor: theme.foreground,
    },
    outline: {
      backgroundColor: "transparent",
      color: theme.foreground,
      borderColor: theme.border,
    },
    ghost: {
      backgroundColor: "transparent",
      color: theme.foreground,
      borderColor: "transparent",
    },
  }[variant]

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: pressed || disabled ? 0.7 : 1,
        },
        style,
      ]}
      {...props}
    >
      <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 52,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
  },
})
