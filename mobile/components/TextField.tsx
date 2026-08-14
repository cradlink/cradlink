import { StyleSheet, TextInput, type TextInputProps } from "react-native"

import { Text, View, useTheme } from "@/components/Themed"

export function TextField({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const theme = useTheme()

  return (
    <View style={styles.wrap} lightColor="transparent" darkColor="transparent">
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.mutedForeground}
        selectionColor={theme.primary}
        style={[
          styles.input,
          {
            color: theme.foreground,
            borderColor: theme.border,
            backgroundColor: theme.background,
          },
        ]}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    backgroundColor: "transparent",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
  },
})
