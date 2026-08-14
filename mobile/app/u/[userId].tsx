import { StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"

import { Refreshable, Stagger } from "@/components/Refreshable"
import { Text } from "@/components/Themed"

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()

  return (
    <Refreshable contentContainerStyle={styles.list}>
      <Stagger>
        <Text key="title" style={styles.title}>
          Public profile
        </Text>
        <Text key="id" style={styles.body} lightColor="#536471" darkColor="#71767b">
          {userId}
        </Text>
        <Text key="copy" style={styles.body}>
          Same user model as the web app. Data wiring is next.
        </Text>
      </Stagger>
    </Refreshable>
  )
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  body: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
  },
})
