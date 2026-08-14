import { StyleSheet } from "react-native"
import { SymbolView, type SymbolViewProps } from "expo-symbols"

import { Button } from "@/components/Button"
import { Text, View, useTheme } from "@/components/Themed"

export function EmptyState({
  title,
  body,
  icon,
  iconColor,
  iconSize,
  action,
}: {
  title: string
  body: string
  icon?: SymbolViewProps["name"]
  iconColor?: string
  iconSize?: number
  action?: { label: string; onPress: () => void; variant?: "primary" | "outline" }
}) {
  const theme = useTheme()

  return (
    <View style={styles.wrap} lightColor="transparent" darkColor="transparent">
      {icon ? (
        <View style={styles.icon} lightColor="transparent" darkColor="transparent">
          <SymbolView name={icon} tintColor={iconColor ?? theme.foreground} size={iconSize ?? 28} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body} lightColor="#536471" darkColor="#71767b">
        {body}
      </Text>
      {action ? (
        <Button
          label={action.label}
          variant={action.variant ?? "outline"}
          onPress={action.onPress}
          style={styles.action}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 32,
    paddingVertical: 72,
    alignItems: "center",
  },
  icon: {
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
  },
  action: {
    marginTop: 24,
    alignSelf: "stretch",
    maxWidth: 280,
  },
})
