import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { ActivityCard } from "@/components/ActivityCard"
import { EmptyState } from "@/components/EmptyState"
import { TopBar } from "@/components/TopBar"
import { Text, View, useTheme } from "@/components/Themed"
import { MOCK_ACTIVITIES } from "@/lib/mock"

export default function FeedScreen() {
  const router = useRouter()
  const theme = useTheme()
  const [query, setQuery] = useState("")
  const activities = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return MOCK_ACTIVITIES
    return MOCK_ACTIVITIES.filter((activity) => {
      const hay = [
        activity.title,
        activity.description,
        activity.creatorName,
        ...activity.tags,
        ...activity.lookingFor,
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  return (
    <View style={styles.screen}>
      <TopBar search searchValue={query} onSearchChange={setQuery} />
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {activities.length === 0 ? (
          <EmptyState title="No matches." body="Try another search." />
        ) : (
          activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
        )}
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
