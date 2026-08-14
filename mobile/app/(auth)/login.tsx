import { StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Logo } from "@/components/Logo"
import { Text, View } from "@/components/Themed"
import { APP_TAGLINE } from "@/constants/config"

export default function LoginScreen() {
  const router = useRouter()

  return (
    <View style={styles.screen}>
      <Logo />
      <Text style={styles.tagline} lightColor="#536471" darkColor="#71767b">
        {APP_TAGLINE}
      </Text>
      <Text style={styles.copy}>
        Auth is next. Same accounts as the web app — local demo first, then Firebase.
      </Text>
      <Button label="Continue as Marko (soon)" disabled />
      <Button label="Create an account" variant="ghost" onPress={() => router.push("/signup")} />
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
  tagline: {
    fontSize: 15,
  },
  copy: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 22,
  },
})
