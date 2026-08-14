import { useMemo, useState } from "react"
import { Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { ActivityCard } from "@/components/ActivityCard"
import { EmptyState } from "@/components/EmptyState"
import { FeedFilters } from "@/components/FeedFilters"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { TopBar } from "@/components/TopBar"
import { Text, View, useTheme } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import type { ActivityType, LocationType } from "@/lib/types"

export default function FeedScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { activities: all } = useActivities()
  const [query, setQuery] = useState("")
  const [type, setType] = useState<ActivityType | "all">("all")
  const [locationType, setLocationType] = useState<LocationType | "all">("all")
  const activities = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((activity) => {
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
  }, [all, query, type, locationType])

  return (
    <View style={styles.screen}>
      <TopBar search searchValue={query} onSearchChange={setQuery} />
      <FeedFilters type={type} locationType={locationType} onType={setType} onLocation={setLocationType} />
      <Refreshable contentContainerStyle={styles.list} keyboardDismissMode="on-drag">
        <Stagger>
          {activities.length === 0 ? (
            <EmptyState key="empty" title="No matches." body="Try another search." />
          ) : (
            activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
          )}
        </Stagger>
      </Refreshable>
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
    flexGrow: 1,
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
