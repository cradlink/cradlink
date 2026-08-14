import { ScrollView, StyleSheet } from "react-native"

import { ActivityCard } from "@/components/ActivityCard"
import { EmptyState } from "@/components/EmptyState"
import { TopBar } from "@/components/TopBar"
import { View } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"

export default function MyActivitiesScreen() {
  const { user } = useAuth()
  const { activities } = useActivities()
  const list = activities.filter((activity) => activity.creatorId === user?.id)

  return (
    <View style={styles.screen}>
      <TopBar title="My activities" />
      <ScrollView>
        {list.length === 0 ? (
          <EmptyState title="You haven’t posted yet." body="Create one from the + button." />
        ) : (
          list.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
})
