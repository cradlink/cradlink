import { StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Text, View } from "@/components/Themed"

export default function SignupScreen() {
  const router = useRouter()

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Join Cradlink</Text>
      <Text style={styles.copy} lightColor="#536471" darkColor="#71767b">
        Sign up form comes next. Email + password, same user model as the web app.
      </Text>
      <Button label="Back to log in" variant="ghost" onPress={() => router.back()} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  copy: {
    fontSize: 16,
    lineHeight: 22,
  },
})
