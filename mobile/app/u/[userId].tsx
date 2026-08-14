import { useEffect, useLayoutEffect } from "react"
import { StyleSheet } from "react-native"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"

import { ActivityCard } from "@/components/ActivityCard"
import { EmptyState } from "@/components/EmptyState"
import { ProfileView } from "@/components/ProfileView"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useConnections } from "@/hooks/use-connections"
import { useI18n } from "@/hooks/use-i18n"

export default function PublicProfileScreen() {
  const navigation = useNavigation()
  const router = useRouter()
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const { user, getUser, reload } = useAuth()
  const { messages } = useI18n()
  const { activities } = useActivities()
  const { canSeeActivities } = useConnections()
  const person = userId ? getUser(userId) : null
  const visible = person ? canSeeActivities(person) : false
  const hosted = person && visible ? activities.filter((activity) => activity.creatorId === person.id) : []
  const isSelf = Boolean(person && user?.id === person.id)

  useLayoutEffect(() => {
    navigation.setOptions({ title: messages.profile.title })
  }, [messages.profile.title, navigation])

  useEffect(() => {
    if (userId && !getUser(userId)) void reload()
  }, [getUser, reload, userId])

  useEffect(() => {
    if (isSelf) router.replace("/profile")
  }, [isSelf, router])

  if (isSelf) return null

  return (
    <Refreshable contentContainerStyle={styles.list}>
      <Stagger>
        {!person ? (
          <EmptyState key="missing" title={messages.profile.missingTitle} body={messages.profile.missingBody} />
        ) : (
          [
            <ProfileView
              key="hero"
              user={person}
              hostedCount={activities.filter((activity) => activity.creatorId === person.id).length}
            />,
            ...(visible
              ? hosted.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
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
  )
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingBottom: 40,
  },
})
