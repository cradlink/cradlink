import { StyleSheet, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Logo } from "@/components/Logo"
import { Text, useTheme } from "@/components/Themed"

export function TopBar({
  title,
  search,
  searchValue,
  onSearchChange,
}: {
  title?: string
  search?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
}) {
  const insets = useSafeAreaInsets()
  const theme = useTheme()

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top,
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        },
      ]}
    >
      {title && !search ? (
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : (
        <View style={styles.searchRow}>
          <Logo compact iconSize={28} />
          <View style={[styles.field, { backgroundColor: theme.muted }]}>
            <TextInput
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder="Search"
              placeholderTextColor={theme.mutedForeground}
              selectionColor={theme.primary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={[styles.input, { color: theme.foreground }]}
            />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    height: 53,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  searchRow: {
    height: 53,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  field: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
})
