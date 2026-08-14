import { Pressable, StyleSheet } from "react-native"

import { Button } from "@/components/Button"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { Text, View, useTheme } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { LOCALES, type Locale } from "@/lib/i18n"

export default function SettingsScreen() {
  const theme = useTheme()
  const { user, signOut } = useAuth()
  const { locale, setLocale, messages } = useI18n()

  return (
    <Refreshable contentContainerStyle={styles.list}>
      <Stagger>
        <Text key="kicker" style={styles.kicker} lightColor="#536471" darkColor="#71767b">
          {messages.settings.account}
        </Text>
        <Text key="name" style={styles.name}>
          {user?.displayName}
        </Text>
        <Text key="email" style={styles.email} lightColor="#536471" darkColor="#71767b">
          {user?.email}
        </Text>
        <Text key="lang" style={[styles.kicker, styles.langKicker]} lightColor="#536471" darkColor="#71767b">
          {messages.settings.language}
        </Text>
        <View key="langs" style={styles.langs} lightColor="transparent" darkColor="transparent">
          {LOCALES.map((value) => (
            <LanguageRow
              key={value}
              label={messages.locales[value]}
              selected={locale === value}
              onPress={() => void setLocale(value as Locale)}
              border={theme.border}
              foreground={theme.foreground}
              muted={theme.mutedForeground}
            />
          ))}
        </View>
        <View key="action" style={styles.action}>
          <Button label={messages.settings.signOut} variant="outline" onPress={() => void signOut()} />
        </View>
      </Stagger>
    </Refreshable>
  )
}

function LanguageRow({
  label,
  selected,
  onPress,
  border,
  foreground,
  muted,
}: {
  label: string
  selected: boolean
  onPress: () => void
  border: string
  foreground: string
  muted: string
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.langRow, { borderBottomColor: border, opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={[styles.langLabel, { color: selected ? foreground : muted }]}>{label}</Text>
      <View style={[styles.radio, { borderColor: selected ? foreground : muted }]}>
        {selected ? <View style={[styles.radioOn, { backgroundColor: foreground }]} /> : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "600",
  },
  name: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  email: {
    marginTop: 4,
    fontSize: 15,
  },
  langKicker: {
    marginTop: 32,
  },
  langs: {
    marginTop: 8,
    backgroundColor: "transparent",
  },
  langRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  langLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  action: {
    marginTop: 28,
    backgroundColor: "transparent",
  },
})
