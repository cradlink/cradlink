import { Pressable, StyleSheet, TextInput, View } from "react-native"
import { usePathname, useRouter } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Logo } from "@/components/Logo"
import { Text, useTheme } from "@/components/Themed"
import { useNotifications } from "@/hooks/use-notifications"

export function TopBar({
  title,
  search,
  searchValue,
  onSearchChange,
  action,
  onSettings,
}: {
  title?: string
  search?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  action?: { label: string; onPress: () => void }
  onSettings?: () => void
}) {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { unread } = useNotifications()

  function openBell() {
    if (pathname !== "/notifications") router.push("/notifications")
  }

  const bell = (
    <Pressable onPress={openBell} hitSlop={8} accessibilityLabel="Notifications" style={styles.bellBtn}>
      <SymbolView
        name={
          unread > 0
            ? { ios: "bell.fill", android: "notifications", web: "notifications" }
            : { ios: "bell", android: "notifications_none", web: "notifications_none" }
        }
        tintColor={theme.foreground}
        size={22}
      />
      {unread > 0 ? <View style={[styles.badge, { backgroundColor: theme.primary }]} /> : null}
    </Pressable>
  )

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
          <View style={styles.right}>
            {bell}
            {onSettings ? (
              <Pressable onPress={onSettings} hitSlop={8} accessibilityLabel="Settings" style={styles.bellBtn}>
                <SymbolView
                  name={{ ios: "gearshape", android: "settings", web: "settings" }}
                  tintColor={theme.foreground}
                  size={22}
                />
              </Pressable>
            ) : null}
            {action ? (
              <Pressable onPress={action.onPress} hitSlop={10} accessibilityLabel={action.label}>
                <Text style={[styles.action, { color: theme.primary }]}>{action.label}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.searchRow}>
          <Logo compact iconSize={28} />
          <View style={[styles.field, { backgroundColor: theme.muted }]}>
            <TextInput
              keyboardAppearance="dark"
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
          {bell}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flexShrink: 1,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  action: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  bellBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#000000",
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
