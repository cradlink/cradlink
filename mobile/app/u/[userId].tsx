import { useEffect, useState } from "react"
import { StyleSheet } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"

import { EmptyState } from "@/components/EmptyState"
import { ProfileActivities } from "@/components/ProfileActivities"
import { ProfileView } from "@/components/ProfileView"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { TopBar } from "@/components/TopBar"
import { ScreenBlurTarget } from "@/components/ScreenBlurTarget"
import { useAuth } from "@/hooks/use-auth"
import { useConnections } from "@/hooks/use-connections"
import { useI18n } from "@/hooks/use-i18n"
import { firebaseAuth } from "@/lib/auth/firebase"
import { handleOf, type User } from "@/lib/types"

function routeId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default function PublicProfileScreen() {
  const router = useRouter()
  const { userId: rawId } = useLocalSearchParams<{ userId: string }>()
  const userId = routeId(rawId)
  const { user, getUser } = useAuth()
  const { messages } = useI18n()
  const { canSeeActivities } = useConnections()
  const [fetched, setFetched] = useState<User | null>(null)
  const person = (userId ? getUser(userId) : null) ?? fetched
  const visible = person ? canSeeActivities(person) : false
  const isSelf = Boolean(person && user?.id === person.id)

  useEffect(() => {
    if (!userId || getUser(userId)) {
      setFetched(null)
      return
    }
    let live = true
    void firebaseAuth
      .getUser(userId)
      .then((next) => {
        if (live) setFetched(next)
      })
      .catch(() => {
        if (live) setFetched(null)
      })
    return () => {
      live = false
    }
  }, [getUser, userId])

  useEffect(() => {
    if (isSelf) router.replace("/profile")
  }, [isSelf, router])

  if (isSelf) return null

  return (
    <ScreenBlurTarget style={styles.screen}>
      <TopBar title={person ? handleOf(person) : messages.profile.title} back />
      <Refreshable contentContainerStyle={styles.list}>
      <Stagger>
        {!person ? (
          <EmptyState key="missing" title={messages.profile.missingTitle} body={messages.profile.missingBody} />
        ) : (
          [
            <ProfileView key="hero" user={person} />,
            ...(visible
              ? [<ProfileActivities key="acts" user={person} />]
              : [
                  <EmptyState
                    key="private"
                    title={messages.profile.privateTitle}
                    body={messages.profile.privateBody}
                    icon={{ ios: "lock.fill", android: "lock", web: "lock" }}
                  />,
                ]),
          ]
        )}
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
