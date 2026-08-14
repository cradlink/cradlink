import { Pressable, StyleSheet, type PressableProps } from "react-native"

import { Text, useTheme } from "@/components/Themed"

export function Button({
  label,
  variant = "primary",
  style,
  ...props
}: PressableProps & { label: string; variant?: "primary" | "ghost" }) {
  const theme = useTheme()
  const primary = variant === "primary"

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: primary ? theme.primary : "transparent",
          opacity: pressed || props.disabled ? 0.7 : 1,
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
