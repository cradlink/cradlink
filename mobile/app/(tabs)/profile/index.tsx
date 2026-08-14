import { StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { ActivityCard } from "@/components/ActivityCard"
import { ProfileView } from "@/components/ProfileView"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { TopBar } from "@/components/TopBar"
import { View } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"

export default function ProfileScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { activities } = useActivities()

  if (!user) return null

  const hosted = activities.filter((activity) => activity.creatorId === user.id)

  return (
    <View style={styles.screen}>
      <TopBar title="Profile" onSettings={() => router.push("/settings")} />
      <Refreshable contentContainerStyle={styles.list}>
        <Stagger>
          <ProfileView key="hero" user={user} isSelf hostedCount={hosted.length} />
          {hosted.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </Stagger>
      </Refreshable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    paddingBottom: 40,
  },
})
