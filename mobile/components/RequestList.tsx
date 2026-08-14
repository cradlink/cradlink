import { Pressable, StyleSheet } from "react-native"

import { Avatar } from "@/components/Avatar"
import { Text, View, useTheme } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useConfirm } from "@/hooks/use-confirm"
import { useMemberships } from "@/hooks/use-memberships"
import { useNotifications } from "@/hooks/use-notifications"
import { useToast } from "@/hooks/use-toast"
import type { Activity } from "@/lib/types"

export function RequestList({ activity }: { activity: Activity }) {
  const theme = useTheme()
  const { user } = useAuth()
  const { ask } = useConfirm()
  const { show } = useToast()
  const { notifyUser } = useNotifications()
  const { isOrganizer, isFull, pendingFor, accept, decline } = useMemberships()
  const pending = pendingFor(activity.id)

  if (!isOrganizer(activity) || pending.length === 0) return null

  const full = isFull(activity)

  return (
    <View style={styles.wrap} lightColor="transparent" darkColor="transparent">
      <Text style={styles.heading}>{pending.length === 1 ? "1 waiting" : `${pending.length} waiting`}</Text>
      {pending.map((row) => (
        <View key={row.id} style={styles.row} lightColor="transparent" darkColor="transparent">
          <Avatar name={row.userName} src={row.userAvatar} size={36} />
          <Text style={styles.name} numberOfLines={1}>
            {row.userName}
          </Text>
          <Pressable
            disabled={full}
            onPress={() => {
              void (async () => {
                try {
                  const next = await accept(row.id, activity)
                  if (!next) {
                    show({ title: full ? "This activity is full" : "Couldn’t accept", tone: "error" })
                    return
                  }
                  await notifyUser(row.userId, {
                    type: "accepted",
                    activityId: activity.id,
                    actorName: user?.displayName ?? "The organizer",
                    actorAvatar: user?.avatarUrl ?? null,
                    title: `You’re in · ${activity.title}`,
                    body: "The organizer accepted your request.",
                  })
                  show({ title: "Accepted" })
                } catch {
                  show({ title: "Couldn’t accept", tone: "error" })
                }
              })()
            }}
            style={({ pressed }) => [
              styles.accept,
              {
                backgroundColor: theme.foreground,
                opacity: full ? 0.35 : pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.acceptLabel, { color: theme.background }]}>Accept</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              ask({
                title: `Decline ${row.userName}?`,
                body: "They can request again later.",
                confirmLabel: "Decline",
                cancelLabel: "Keep them",
                destructive: true,
                onConfirm: () => {
                  void (async () => {
                    try {
                      const next = await decline(row.id)
                      if (!next) {
                        show({ title: "Couldn’t decline", tone: "error" })
                        return
                      }
                      await notifyUser(row.userId, {
                        type: "declined",
                        activityId: activity.id,
                        actorName: user?.displayName ?? "The organizer",
                        actorAvatar: user?.avatarUrl ?? null,
                        title: `Not this time · ${activity.title}`,
                        body: "The organizer declined your request.",
                      })
                      show({ title: "Declined" })
                    } catch {
                      show({ title: "Couldn’t decline", tone: "error" })
                    }
                  })()
                },
              })
            }
            style={({ pressed }) => [styles.decline, { borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.declineLabel}>Decline</Text>
          </Pressable>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    marginTop: 6,
  },
  heading: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "700",
  },
  accept: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  decline: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  declineLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
})
