import { StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Text, View, useTheme } from "@/components/Themed"

export default function ProfileScreen() {
  const router = useRouter()
  const theme = useTheme()

  return (
    <View style={styles.screen}>
      <View style={[styles.avatar, { backgroundColor: theme.muted, borderColor: theme.border }]}>
        <Text style={styles.initials}>MN</Text>
      </View>
      <Text style={styles.name}>Marko Njegomir</Text>
      <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
        Belgrade
      </Text>
      <Text style={styles.bio}>
        Doctoral student. I start things so other people have a place to show up.
      </Text>
      <View style={styles.actions} lightColor="transparent" darkColor="transparent">
        <Button label="Edit profile" onPress={() => router.push("/profile/edit")} />
        <Button label="Sign in" variant="ghost" onPress={() => router.push("/login")} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  avatar: {
    height: 72,
    width: 72,
    borderRadius: 36,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 22,
    fontWeight: "700",
  },
  name: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "700",
  },
  meta: {
    marginTop: 4,
    fontSize: 15,
  },
  bio: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    marginTop: 24,
    gap: 8,
    backgroundColor: "transparent",
  },
})
