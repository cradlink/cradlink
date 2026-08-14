import { StyleSheet } from "react-native"

import { Button } from "@/components/Button"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { Text, View } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"

export default function SettingsScreen() {
  const { user, signOut } = useAuth()

  return (
    <Refreshable contentContainerStyle={styles.list}>
      <Stagger>
        <Text key="kicker" style={styles.kicker} lightColor="#536471" darkColor="#71767b">
          Account
        </Text>
        <Text key="name" style={styles.name}>
          {user?.displayName}
        </Text>
        <Text key="email" style={styles.email} lightColor="#536471" darkColor="#71767b">
          {user?.email}
        </Text>
        <View key="action" style={styles.action}>
          <Button label="Sign out" variant="outline" onPress={() => void signOut()} />
        </View>
      </Stagger>
    </Refreshable>
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
  action: {
    marginTop: 28,
    backgroundColor: "transparent",
  },
})
