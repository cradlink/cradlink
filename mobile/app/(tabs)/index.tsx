import { useMemo, useState } from "react"
import { Keyboard, Pressable, ScrollView, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { ActivityCard } from "@/components/ActivityCard"
import { EmptyState } from "@/components/EmptyState"
import { FeedFilters } from "@/components/FeedFilters"
import { TopBar } from "@/components/TopBar"
import { Text, View, useTheme } from "@/components/Themed"
import { MOCK_ACTIVITIES } from "@/lib/mock"
import type { ActivityType, LocationType } from "@/lib/types"

export default function FeedScreen() {
  const router = useRouter()
  const theme = useTheme()
  const [query, setQuery] = useState("")
  const [type, setType] = useState<ActivityType | "all">("all")
  const [locationType, setLocationType] = useState<LocationType | "all">("all")
  const activities = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MOCK_ACTIVITIES.filter((activity) => {
      if (type !== "all" && activity.type !== type) return false
      if (locationType !== "all" && activity.location.type !== locationType) return false
      if (!q) return true
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
  }, [query, type, locationType])

  return (
    <View style={styles.screen}>
      <TopBar search searchValue={query} onSearchChange={setQuery} />
      <FeedFilters type={type} locationType={locationType} onType={setType} onLocation={setLocationType} />
      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={Keyboard.dismiss}
      >
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
