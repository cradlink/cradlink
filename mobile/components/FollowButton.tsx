import { StyleSheet } from "react-native"

import { Button } from "@/components/Button"
import { useAuth } from "@/hooks/use-auth"
import { useConnections } from "@/hooks/use-connections"
import { useI18n } from "@/hooks/use-i18n"
import { useNotifications } from "@/hooks/use-notifications"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"

export function FollowButton({ person }: { person: User }) {
  const { user } = useAuth()
  const { show } = useToast()
  const { notifyUser } = useNotifications()
  const { messages, tx } = useI18n()
  const { statusOf, follow, unfollow, cancelRequest } = useConnections()
  const status = statusOf(person.id)

  async function notify(type: "follow" | "follow_request") {
    if (!user) return
    await notifyUser(person.id, {
      type,
      activityId: null,
      actorId: user.id,
      actorName: user.displayName,
      actorAvatar: user.avatarUrl,
      title:
        type === "follow"
          ? tx(messages.notifications.followTitle, { name: user.displayName })
          : tx(messages.notifications.followRequestTitle, { name: user.displayName }),
      body: type === "follow" ? messages.notifications.followBody : messages.notifications.followRequestBody,
    })
  }

  if (status === "following") {
    return (
      <Button
        label={messages.follow.following}
        variant="outline"
        size="compact"
        onPress={() => {
          void unfollow(person.id).then(() => show({ title: messages.follow.unfollowed }))
        }}
        style={styles.btn}
      />
    )
  }

  if (status === "pending") {
    return (
      <Button
        label={messages.follow.requested}
        variant="outline"
        size="compact"
        onPress={() => {
          void cancelRequest(person.id).then(() => show({ title: messages.follow.cancelled }))
        }}
        style={styles.btn}
      />
    )
  }

  return (
    <Button
      label={messages.follow.follow}
      variant="ink"
      size="compact"
      onPress={() => {
        void (async () => {
          try {
            const next = await follow(person)
            if (next === "pending") {
              await notify("follow_request")
              show({ title: messages.follow.requestedToast })
              return
            }
            await notify("follow")
            show({ title: messages.follow.followed })
          } catch {
            show({ title: messages.follow.couldnt, tone: "error" })
          }
        })()
      }}
      style={styles.btn}
    />
  )
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: "flex-start",
  },
})
