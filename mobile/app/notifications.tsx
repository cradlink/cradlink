import { useRef } from "react"
import { Pressable, StyleSheet, View as RNView } from "react-native"

import { Avatar } from "@/components/Avatar"
import { EmptyState } from "@/components/EmptyState"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { TopBar } from "@/components/TopBar"
import { Text, View, useTheme } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useActivityPreview } from "@/hooks/use-activity-preview"
import { useNotifications } from "@/hooks/use-notifications"
import { formatRelative } from "@/lib/format"
import type { AppNotification } from "@/lib/types"

export default function NotificationsScreen() {
  const theme = useTheme()
  const { items, markRead } = useNotifications()
  const { get } = useActivities()
  const { open } = useActivityPreview()

  return (
    <View style={styles.screen}>
      <TopBar title="Notifications" />
      <Refreshable contentContainerStyle={styles.list}>
        <Stagger>
          {items.length === 0 ? (
            <EmptyState
              key="empty"
              title="No notifications."
              body="Joins, requests, and reminders for your activities land here."
              icon={{ ios: "bell", android: "notifications_none", web: "notifications_none" }}
            />
          ) : (
            items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onOpen={() => {
                  void markRead(item.id)
                  if (!item.activityId) return
                  const activity = get(item.activityId)
                  if (!activity) return
                  open(activity, { x: 0, y: 80, width: 1, height: 1 })
                }}
                unreadColor={theme.primary}
                border={theme.border}
              />
            ))
          )}
        </Stagger>
      </Refreshable>
    </View>
  )
}

function NotificationRow({
  item,
  onOpen,
  unreadColor,
  border,
}: {
  item: AppNotification
  onOpen: () => void
  unreadColor: string
  border: string
}) {
  const ref = useRef<RNView>(null)

  return (
    <RNView ref={ref} collapsable={false}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [
          styles.row,
          { borderBottomColor: border, backgroundColor: pressed ? "rgba(231,233,234,0.03)" : "transparent" },
        ]}
      >
        <Avatar name={item.actorName} src={item.actorAvatar} size={40} />
        <View style={styles.body} lightColor="transparent" darkColor="transparent">
          <Text style={[styles.title, !item.read && styles.unread]}>{item.title}</Text>
          <Text style={styles.copy} lightColor="#536471" darkColor="#71767b">
            {item.body}
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
