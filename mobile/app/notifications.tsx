import { useRef } from "react"
import { useRouter } from "expo-router"
import { Pressable, StyleSheet, View as RNView } from "react-native"

import { Avatar } from "@/components/Avatar"
import { EmptyState } from "@/components/EmptyState"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { TopBar } from "@/components/TopBar"
import { ScreenBlurTarget } from "@/components/ScreenBlurTarget"
import { Text, View, useTheme } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useActivityPreview, type CardOrigin } from "@/hooks/use-activity-preview"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { useNotifications } from "@/hooks/use-notifications"
import { formatRelative } from "@/lib/format"
import { formatShortWhen } from "@/lib/schedule"
import type { Activity, AppNotification } from "@/lib/types"
import type { Messages } from "@/lib/i18n"
import { tx } from "@/lib/i18n"

export default function NotificationsScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { items, markRead } = useNotifications()
  const { get } = useActivities()
  const { open } = useActivityPreview()
  const { user, people } = useAuth()
  const { messages } = useI18n()

  function actorIdOf(item: AppNotification) {
    if (item.actorId) return item.actorId
    const match = people.find((person) => person.displayName === item.actorName)
    return match?.id ?? null
  }

  function openProfile(item: AppNotification) {
    void markRead(item.id)
    const id = actorIdOf(item)
    if (!id) return
    if (id === user?.id) router.push("/profile")
    else router.push(`/u/${id}`)
  }

  function openActivity(item: AppNotification, origin: CardOrigin) {
    void markRead(item.id)
    if (!item.activityId) return
    const activity = get(item.activityId)
    if (!activity) return
    open(activity, origin)
  }

  return (
    <ScreenBlurTarget style={styles.screen}>
      <TopBar title={messages.notifications.title} back />
      <Refreshable contentContainerStyle={styles.list}>
        <Stagger>
          {items.length === 0 ? (
            <EmptyState
              key="empty"
              title={messages.notifications.emptyTitle}
              body={messages.notifications.emptyBody}
              icon={{ ios: "bell", android: "notifications_none", web: "notifications_none" }}
            />
          ) : (
            items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                copy={notificationCopy(item, messages, item.activityId ? get(item.activityId) : null)}
                onPerson={() => openProfile(item)}
                onOpen={(origin) => {
                  if (item.type === "reminder") openActivity(item, origin)
                  else openProfile(item)
                }}
                unreadColor={theme.primary}
                border={theme.border}
              />
            ))
          )}
        </Stagger>
      </Refreshable>
    </ScreenBlurTarget>
  )
}

function notificationCopy(item: AppNotification, m: Messages, activity: Activity | null) {
  const name = item.actorName
  const title = activity?.title || item.title
  switch (item.type) {
    case "joined":
      return { title: tx(m.notifications.joinedTitle, { name, title }), body: m.notifications.joinedBody }
    case "request":
      return { title: tx(m.notifications.requestTitle, { name, title }), body: m.notifications.requestBody }
    case "accepted":
      return { title: tx(m.notifications.acceptedTitle, { title }), body: m.notifications.acceptedBody }
    case "declined":
      return { title: tx(m.notifications.declinedTitle, { title }), body: m.notifications.declinedBody }
    case "updated":
      return { title: tx(m.notifications.updatedTitle, { title }), body: m.notifications.updatedBody }
    case "follow":
      return { title: tx(m.notifications.followTitle, { name }), body: m.notifications.followBody }
    case "follow_request":
      return { title: tx(m.notifications.followRequestTitle, { name }), body: m.notifications.followRequestBody }
    case "follow_accepted":
      return { title: tx(m.notifications.followAcceptedTitle, { name }), body: m.notifications.followAcceptedBody }
    case "reminder":
      return {
        title,
        body:
          activity && (activity.isFlexible || !activity.startAt)
            ? m.notifications.reminderFlex
            : activity
              ? tx(m.notifications.reminderWhen, { when: formatShortWhen(activity) })
              : item.body,
      }
    default:
      return { title: item.title, body: item.body }
  }
}

function NotificationRow({
  item,
  copy,
  onPerson,
  onOpen,
  unreadColor,
  border,
}: {
  item: AppNotification
  copy: { title: string; body: string }
  onPerson: () => void
  onOpen: (origin: CardOrigin) => void
  unreadColor: string
  border: string
}) {
  const ref = useRef<RNView>(null)
  return (
    <RNView ref={ref} collapsable={false}>
    <Pressable
      onPress={() => {
        ref.current?.measureInWindow((x, y, width, height) => {
          onOpen({ x, y, width, height })
        })
      }}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: border, backgroundColor: pressed ? "rgba(231,233,234,0.03)" : "transparent" },
      ]}
    >
      <Pressable onPress={onPerson} hitSlop={6}>
        <Avatar name={item.actorName} src={item.actorAvatar} size={40} />
      </Pressable>
      <View style={styles.body} lightColor="transparent" darkColor="transparent">
        <Text style={[styles.title, !item.read && styles.unread]}>{copy.title}</Text>
        <Text style={styles.copy} lightColor="#536471" darkColor="#71767b">
          {copy.body}
        </Text>
        <Text style={styles.time} lightColor="#536471" darkColor="#71767b">
          {formatRelative(item.createdAt)}
        </Text>
      </View>
      {!item.read ? <View style={[styles.dot, { backgroundColor: unreadColor }]} /> : null}
    </Pressable>
    </RNView>
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
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  unread: {
    fontWeight: "800",
  },
  copy: {
    fontSize: 13,
    lineHeight: 17,
  },
  time: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
})
