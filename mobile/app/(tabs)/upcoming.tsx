import { ScrollView, StyleSheet } from "react-native"

import { ActivityCard } from "@/components/ActivityCard"
import { EmptyState } from "@/components/EmptyState"
import { TopBar } from "@/components/TopBar"
import { View } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useMemberships } from "@/hooks/use-memberships"
import { MOCK_ACTIVITIES } from "@/lib/mock"

export default function UpcomingScreen() {
  const { user } = useAuth()
  const { joinedIds } = useMemberships()
  const list = MOCK_ACTIVITIES.filter(
    (activity) => activity.creatorId !== user?.id && joinedIds.includes(activity.id),
  )

  return (
    <View style={styles.screen}>
      <TopBar title="Upcoming" />
      <ScrollView>
        {list.length === 0 ? (
          <EmptyState
            title="Nothing upcoming."
            body="Join something from Home and it will show up here."
          />
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
