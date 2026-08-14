import { StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"

import { Text, View } from "@/components/Themed"

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Public profile</Text>
      <Text style={styles.body} lightColor="#536471" darkColor="#71767b">
        {userId}
      </Text>
      <Text style={styles.body}>Same user model as the web app. Data wiring is next.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
})
