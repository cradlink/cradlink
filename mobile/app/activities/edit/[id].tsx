import { StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ActivityCompose } from "@/components/ActivityCompose"
import { EmptyState } from "@/components/EmptyState"
import { View } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"

export default function EditActivityScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { get, ready } = useActivities()
  const activity = id ? get(id) : null

  if (!ready) return <View style={styles.screen} />

  if (!activity || activity.creatorId !== user?.id) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <EmptyState title="Can’t edit this." body="Only the organizer can change an activity." />
      </View>
    )
  }

  return <ActivityCompose activity={activity} />
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
})
