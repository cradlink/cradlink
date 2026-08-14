import { useEffect, useMemo, useState } from "react"
import { BackHandler, Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { ActivityCard } from "@/components/ActivityCard"
import { EmptyState } from "@/components/EmptyState"
import { FeedFilters } from "@/components/FeedFilters"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { SearchResults } from "@/components/SearchResults"
import { TopBar } from "@/components/TopBar"
import { ScreenBlurTarget } from "@/components/ScreenBlurTarget"
import { Text, useTheme } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useConnections } from "@/hooks/use-connections"
import { useI18n } from "@/hooks/use-i18n"
import { replayBoot } from "@/lib/boot-preview"
import type { ActivityType, LocationType } from "@/lib/types"

export default function FeedScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { activities: all } = useActivities()
  const { getUser } = useAuth()
  const { canSeeActivities } = useConnections()
  const { messages } = useI18n()
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState("")
  const [type, setType] = useState<ActivityType | "all">("all")
  const [locationType, setLocationType] = useState<LocationType | "all">("all")
  const activities = useMemo(() => {
    return all.filter((activity) => {
      if (!canSeeActivities(getUser(activity.creatorId))) return false
      if (type !== "all" && activity.type !== type) return false
      if (locationType !== "all" && activity.location.type !== locationType) return false
      return true
    })
  }, [all, canSeeActivities, getUser, locationType, type])

  function closeSearch() {
    setQuery("")
    setSearching(false)
  }

  useEffect(() => {
    if (!searching) return
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeSearch()
      return true
    })
    return () => sub.remove()
  }, [searching])

  return (
    <ScreenBlurTarget style={styles.screen}>
      <TopBar
        search
        searchActive={searching}
        searchValue={query}
        onSearchChange={setQuery}
        onSearchPress={() => setSearching(true)}
      />
      {searching ? (
        <SearchResults query={query} />
      ) : (
        <>
          <FeedFilters type={type} locationType={locationType} onType={setType} onLocation={setLocationType} />
          <Refreshable contentContainerStyle={styles.list} keyboardDismissMode="on-drag">
            <Stagger>
              {activities.length === 0 ? (
                <EmptyState key="empty" title={messages.home.noMatchesTitle} body={messages.home.noMatchesBody} />
              ) : (
                activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
              )}
            </Stagger>
          </Refreshable>
          <Pressable
            onPress={() => replayBoot()}
            style={({ pressed }) => [
              styles.fab,
              styles.previewFab,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.previewLabel}>A</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/activities/new")}
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.fabLabel, { color: theme.primaryForeground }]}>+</Text>
          </Pressable>
        </>
      )}
    </ScreenBlurTarget>
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
  previewFab: {
    right: 84,
    backgroundColor: "#16181c",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2f3336",
  },
  previewLabel: {
    fontSize: 20,
    fontWeight: "800",
    color: "#e7e9ea",
    marginTop: -1,
  },
  fabLabel: {
    fontSize: 32,
    fontWeight: "400",
    marginTop: -2,
  },
})
