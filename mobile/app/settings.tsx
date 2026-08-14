import { StyleSheet } from "react-native"

import { Button } from "@/components/Button"
import { Text, View } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"

export default function SettingsScreen() {
  const { user, signOut } = useAuth()

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker} lightColor="#536471" darkColor="#71767b">
        Signed in as
      </Text>
      <Text style={styles.name}>{user?.displayName}</Text>
      <Text style={styles.email} lightColor="#536471" darkColor="#71767b">
        {user?.email}
      </Text>
      <View style={styles.action}>
        <Button label="Sign out" variant="outline" onPress={() => void signOut()} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  kicker: {
    fontSize: 13,
  },
  name: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "800",
  },
  email: {
    marginTop: 4,
    fontSize: 15,
  },
  action: {
    marginTop: 28,
    backgroundColor: "transparent",
  },
})
