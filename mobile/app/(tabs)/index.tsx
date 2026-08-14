import { Pressable, ScrollView, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { ActivityCard } from "@/components/ActivityCard"
import { Text, View, useTheme } from "@/components/Themed"
import { APP_TAGLINE } from "@/constants/config"
import { useAuth } from "@/hooks/use-auth"
import { MOCK_ACTIVITIES } from "@/lib/mock"

export default function FeedScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { user } = useAuth()
  const first = user?.displayName.split(" ")[0]

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.list}>
        <View style={[styles.intro, { borderBottomColor: theme.border }]}>
          <Text style={styles.kicker} lightColor="#536471" darkColor="#71767b">
            {APP_TAGLINE}
          </Text>
          <Text style={styles.lede}>{first ? `Hi ${first}.` : "What’s assembling"}</Text>
        </View>
        {MOCK_ACTIVITIES.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </ScrollView>
      <Pressable
        onPress={() => router.push("/activities/new")}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[styles.fabLabel, { color: theme.primaryForeground }]}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    paddingBottom: 96,
  },
  intro: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  kicker: {
    fontSize: 13,
  },
  lede: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  fabLabel: {
    fontSize: 32,
    fontWeight: "400",
    marginTop: -2,
  },
})
