import { StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ActivityCompose } from "@/components/ActivityCompose"
import { EmptyState } from "@/components/EmptyState"
import { View } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"

export default function EditActivityScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { get, ready } = useActivities()
  const { messages } = useI18n()
  const activity = id ? get(id) : null

  if (!ready) return <View style={styles.screen} />

  if (!activity || activity.creatorId !== user?.id) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <EmptyState title={messages.activity.cantEditTitle} body={messages.activity.cantEditBody} />
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
