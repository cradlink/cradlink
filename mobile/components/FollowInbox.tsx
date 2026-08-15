import { Pressable, StyleSheet, View as RNView } from "react-native"
import { useRouter } from "expo-router"

import { Avatar } from "@/components/Avatar"
import { CreatorPress } from "@/components/CreatorPress"
import { Text, View, useTheme } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useConnections } from "@/hooks/use-connections"
import { useI18n } from "@/hooks/use-i18n"
import { useNotifications } from "@/hooks/use-notifications"
import { useToast } from "@/hooks/use-toast"
import { personLook } from "@/lib/person-look"
import { handleOf, type FollowRequest } from "@/lib/types"

const LIST_CAP = 3

export function FollowInbox() {
  const router = useRouter()
  const { inbox } = useConnections()
  const { messages, tx } = useI18n()
  const items = inbox()
  if (items.length === 0) return null

  const compact = items.length > LIST_CAP

  return (
    <View style={styles.inbox} lightColor="transparent" darkColor="transparent">
      {compact ? (
        <Pressable onPress={() => router.push("/follow-requests")} style={styles.summary}>
          <AvatarStack people={items} />
          <Text style={styles.summaryLabel}>
            {tx(messages.requests.manyWaiting, { count: items.length })}
          </Text>
          <Text style={styles.summaryAction} lightColor="#536471" darkColor="#71767b">
            {messages.common.showMore}
          </Text>
        </Pressable>
      ) : (
        <>
          <Text style={styles.kicker} lightColor="#536471" darkColor="#71767b">
            {messages.profile.requestsTitle}
          </Text>
          {items.map((row) => (
            <FollowRow key={row.id} row={row} />
          ))}
        </>
      )}
    </View>
  )
}

export function FollowRow({ row }: { row: FollowRequest }) {
  const theme = useTheme()
  const { user, getUser } = useAuth()
  const look = personLook(getUser, row.fromId, row.fromName, row.fromAvatar)
  const { show } = useToast()
  const { notifyUser } = useNotifications()
  const { accept, decline } = useConnections()
  const { messages, tx } = useI18n()

  async function onAccept() {
    try {
      const next = await accept(row.id)
      if (!next) return
      await notifyUser(row.fromId, {
        type: "follow_accepted",
        activityId: null,
        actorId: user?.id ?? null,
        actorName: user?.displayName ?? messages.requests.organizer,
        actorAvatar: user?.avatarUrl ?? null,
        title: tx(messages.notifications.followAcceptedTitle, { name: user?.displayName ?? "" }),
        body: messages.notifications.followAcceptedBody,
      })
      show({ title: messages.follow.accepted })
    } catch {
      show({ title: messages.follow.couldnt, tone: "error" })
    }
  }

  async function onDecline() {
    try {
      const next = await decline(row.id)
      if (!next) return
      show({ title: messages.follow.declined })
    } catch {
      show({ title: messages.follow.couldnt, tone: "error" })
    }
  }

  return (
    <View style={styles.row} lightColor="transparent" darkColor="transparent">
      <CreatorPress userId={row.fromId}>
        <Avatar name={look.name} src={look.avatar} size={40} />
      </CreatorPress>
      <View style={styles.who} lightColor="transparent" darkColor="transparent">
        <CreatorPress userId={row.fromId}>
          <Text style={styles.name} numberOfLines={1}>
            {look.name}
          </Text>
        </CreatorPress>
        <Text style={styles.handle} numberOfLines={1} lightColor="#8b98a5" darkColor="#8b98a5">
          {handleOf(getUser(row.fromId) ?? row.fromName)}
        </Text>
        <Text style={styles.sub} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
          {messages.follow.wantsFollow}
        </Text>
      </View>
      <Pressable onPress={() => void onDecline()} hitSlop={6} style={({ pressed }) => [styles.ghost, { opacity: pressed ? 0.6 : 1 }]}>
        <Text style={styles.ghostLabel} lightColor="#536471" darkColor="#71767b">
          {messages.common.decline}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => void onAccept()}
        style={({ pressed }) => [styles.accept, { backgroundColor: theme.foreground, opacity: pressed ? 0.75 : 1 }]}
      >
        <Text style={[styles.acceptLabel, { color: theme.background }]}>{messages.common.accept}</Text>
      </Pressable>
    </View>
  )
}

function AvatarStack({ people }: { people: FollowRequest[] }) {
  const size = 28
  const step = 18
  const shown = people.slice(0, LIST_CAP)
  return (
    <RNView style={{ height: size, width: step * (shown.length - 1) + size }}>
      {shown.map((person, index) => (
        <RNView
          key={person.id}
          style={{
            position: "absolute",
            left: index * step,
            top: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
            borderWidth: 1.5,
            borderColor: "#000000",
            zIndex: shown.length - index,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000000",
          }}
        >
          <Avatar name={person.fromName} src={person.fromAvatar} size={size} />
        </RNView>
      ))}
    </RNView>
  )
}

const styles = StyleSheet.create({
  inbox: {
    paddingTop: 16,
    paddingBottom: 6,
    gap: 14,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "600",
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 32,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  summaryAction: {
    fontSize: 13,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  who: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  handle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
  },
  sub: {
    fontSize: 13,
    lineHeight: 16,
  },
  ghost: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  ghostLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  accept: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
})
