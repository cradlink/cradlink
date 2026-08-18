import { StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { ProfileActivities } from "@/components/ProfileActivities"
import { ProfileView } from "@/components/ProfileView"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { TopBar } from "@/components/TopBar"
import { ScreenBlurTarget } from "@/components/ScreenBlurTarget"
import { useAuth } from "@/hooks/use-auth"
import { handleOf } from "@/lib/types"

export default function ProfileScreen() {
  const router = useRouter()
  const { user } = useAuth()
  if (!user) return null

  return (
    <ScreenBlurTarget style={styles.screen}>
      <TopBar title={handleOf(user)} onSettings={() => router.push("/settings")} />
      <Refreshable contentContainerStyle={styles.list}>
        <Stagger>
          <ProfileView key="hero" user={user} isSelf />
          <ProfileActivities key="acts" user={user} isSelf />
        </Stagger>
      </Refreshable>
    </ScreenBlurTarget>
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
