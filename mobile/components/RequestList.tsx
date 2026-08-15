import { useEffect, useRef, useState } from "react"
import { Pressable, StyleSheet, View as RNView } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"

import { Avatar } from "@/components/Avatar"
import { CreatorPress } from "@/components/CreatorPress"
import { Text, View, useTheme } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { usePreviewReview } from "@/hooks/use-activity-preview"
import { useAuth } from "@/hooks/use-auth"
import { useConfirm } from "@/hooks/use-confirm"
import { useMemberships } from "@/hooks/use-memberships"
import { useNotifications } from "@/hooks/use-notifications"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { handleOf, type Activity, type JoinRequest } from "@/lib/types"

const LIST_CAP = 3

export function WaitingInbox() {
  const { inbox } = useMemberships()
  const { activities } = useActivities()
  const { messages, tx } = useI18n()
  const [open, setOpen] = useState(false)
  const items = inbox()
  if (items.length === 0) return null
  const visible = open ? items : items.slice(0, LIST_CAP)

  return (
    <View style={styles.inbox} lightColor="transparent" darkColor="transparent">
      <Text style={styles.kicker} lightColor="#536471" darkColor="#71767b">
        {items.length === 1 ? messages.requests.oneWaiting : tx(messages.requests.manyWaiting, { count: items.length })}
      </Text>
      {visible.map((row) => {
        const activity = activities.find((item) => item.id === row.activityId)
        if (!activity) return null
        return <RequestRow key={row.id} row={row} activity={activity} subtitle={activity.title} />
      })}
      {items.length > LIST_CAP ? (
        <Pressable onPress={() => setOpen((value) => !value)} hitSlop={8}>
          <Text style={styles.more} lightColor="#536471" darkColor="#71767b">
            {open ? messages.common.showLess : messages.common.showMore}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function RequestList({ activity, compact = false }: { activity: Activity; compact?: boolean }) {
  const { isOrganizer, pendingFor } = useMemberships()
  const pending = pendingFor(activity.id)

  if (!isOrganizer(activity) || pending.length === 0) return null
  if (compact) return <CompactRequests activity={activity} pending={pending} />

  return <CappedList activity={activity} pending={pending} />
}

function CappedList({ activity, pending }: { activity: Activity; pending: JoinRequest[] }) {
  const { messages, tx } = useI18n()
  const [open, setOpen] = useState(false)
  const visible = open ? pending : pending.slice(0, LIST_CAP)

  return (
    <View style={styles.wrap} lightColor="transparent" darkColor="transparent">
      <Text style={styles.kicker} lightColor="#536471" darkColor="#71767b">
        {pending.length === 1 ? messages.requests.oneWaiting : tx(messages.requests.manyWaiting, { count: pending.length })}
      </Text>
      {visible.map((row) => (
        <RequestRow key={row.id} row={row} activity={activity} />
      ))}
      {pending.length > LIST_CAP ? (
        <Pressable onPress={() => setOpen((value) => !value)} hitSlop={8}>
          <Text style={styles.more} lightColor="#536471" darkColor="#71767b">
            {open ? messages.common.showLess : messages.common.showMore}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const LIFT = { duration: 320, easing: Easing.bezier(0.16, 1, 0.3, 1) }

function CompactRequests({ activity, pending }: { activity: Activity; pending: JoinRequest[] }) {
  const { messages, tx } = useI18n()
  const { reviewOpen, setReviewOpen } = usePreviewReview()
  const many = pending.length > 1
  const [open, setOpen] = useState(reviewOpen)
  const [panelH, setPanelH] = useState(0)
  const extra = pending.length - 1
  const height = useSharedValue(0)
  const opacity = useSharedValue(0)
  const restore = useRef(reviewOpen)

  useEffect(() => {
    if (!many) return
    if (restore.current && panelH > 0) {
      height.value = panelH
      opacity.value = 1
      restore.current = false
      return
    }
    height.value = withTiming(open ? panelH : 0, LIFT)
    opacity.value = withTiming(open ? 1 : 0, { duration: open ? 280 : 180, easing: LIFT.easing })
  }, [height, many, opacity, open, panelH])

  const panel = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: "hidden" as const,
    backgroundColor: "#16181c",
  }))

  if (!many) return <RequestRow row={pending[0]} activity={activity} />

  return (
    <View style={styles.compact} lightColor="transparent" darkColor="transparent">
      <Pressable
        onPress={() => {
          const next = !open
          setOpen(next)
          setReviewOpen(next)
        }}
        style={styles.summary}
      >
        <AvatarStack people={pending} ring="#16181c" />
        <Text style={styles.summaryLabel}>
          {pending.length === 1 ? messages.requests.oneWaiting : tx(messages.requests.manyWaiting, { count: pending.length })}
        </Text>
        <Text style={styles.summaryAction} lightColor="#536471" darkColor="#71767b">
          {open ? messages.common.hide : messages.common.review}
        </Text>
      </Pressable>
      <Animated.View style={panel} pointerEvents={open ? "auto" : "none"}>
        <View
          collapsable={false}
          style={styles.panelInner}
          onLayout={(event) => {
            const next = Math.round(event.nativeEvent.layout.height)
            if (next > 0 && next !== panelH) setPanelH(next)
          }}
        >
          <RequestRow row={pending[0]} activity={activity} />
          {extra > 0 ? (
            <Text style={[styles.more, styles.morePad]} lightColor="#536471" darkColor="#71767b">
              {tx(messages.requests.moreOnMine, { count: extra })}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  )
}

function AvatarStack({ people, ring }: { people: JoinRequest[]; ring: string }) {
  const size = 28
  const step = 18
  const shown = people.slice(0, 3)
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
            borderColor: ring,
            zIndex: shown.length - index,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: ring,
          }}
        >
          <Avatar name={person.userName} src={person.userAvatar} size={size} />
        </RNView>
      ))}
    </RNView>
  )
}

function RequestRow({
  row,
  activity,
  subtitle,
}: {
  row: JoinRequest
  activity: Activity
  subtitle?: string
}) {
  const theme = useTheme()
  const { user, getUser } = useAuth()
  const { ask } = useConfirm()
  const { show } = useToast()
  const { messages, tx } = useI18n()
  const { notifyUser } = useNotifications()
  const { isFull, accept, decline } = useMemberships()
  const full = isFull(activity)

  async function onAccept() {
    if (full) {
      show({ title: messages.requests.alreadyFull, tone: "error" })
      return
    }
    try {
      const next = await accept(row.id, activity)
      if (!next) {
        show({ title: messages.requests.alreadyFull, tone: "error" })
        return
      }
      await notifyUser(row.userId, {
        type: "accepted",
        activityId: activity.id,
        actorId: user?.id ?? null,
        actorName: user?.displayName ?? messages.requests.organizer,
        actorAvatar: user?.avatarUrl ?? null,
        title: tx(messages.notifications.acceptedTitle, { title: activity.title }),
        body: messages.notifications.acceptedBody,
      })
      show({ title: messages.requests.accepted })
    } catch {
      show({ title: messages.requests.couldntAccept, tone: "error" })
    }
  }

  function onDecline() {
    ask({
      title: tx(messages.requests.declineTitle, { name: row.userName }),
      body: messages.requests.declineBody,
      confirmLabel: messages.common.decline,
      cancelLabel: messages.requests.keepThem,
      destructive: true,
      onConfirm: () => {
        void (async () => {
          try {
            const next = await decline(row.id)
            if (!next) {
              show({ title: messages.requests.couldntDecline, tone: "error" })
              return
            }
            await notifyUser(row.userId, {
              type: "declined",
              activityId: activity.id,
              actorId: user?.id ?? null,
              actorName: user?.displayName ?? messages.requests.organizer,
              actorAvatar: user?.avatarUrl ?? null,
              title: tx(messages.notifications.declinedTitle, { title: activity.title }),
              body: messages.notifications.declinedBody,
            })
            show({ title: messages.requests.declined })
          } catch {
            show({ title: messages.requests.couldntDecline, tone: "error" })
          }
        })()
      },
    })
  }

  return (
    <View style={styles.row} lightColor="transparent" darkColor="transparent">
      <CreatorPress userId={row.userId}>
        <Avatar name={row.userName} src={row.userAvatar} size={40} />
      </CreatorPress>
      <View style={styles.who} lightColor="transparent" darkColor="transparent">
        <CreatorPress userId={row.userId}>
          <Text style={styles.name} numberOfLines={1}>
            {row.userName}
          </Text>
        </CreatorPress>
        <Text style={styles.handle} numberOfLines={1} lightColor="#8b98a5" darkColor="#8b98a5">
          {handleOf(getUser(row.userId) ?? row.userName)}
        </Text>
        <Text style={styles.sub} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
          {subtitle ? tx(messages.requests.wantsJoinNamed, { title: subtitle }) : messages.requests.wantsJoin}
        </Text>
      </View>
      <Pressable
        onPress={onDecline}
        hitSlop={6}
        style={({ pressed }) => [styles.ghost, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={styles.ghostLabel} lightColor="#536471" darkColor="#71767b">
          {messages.common.decline}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => void onAccept()}
        style={({ pressed }) => [
          styles.accept,
          {
            backgroundColor: theme.foreground,
            opacity: full ? 0.35 : pressed ? 0.75 : 1,
          },
        ]}
      >
        <Text style={[styles.acceptLabel, { color: theme.background }]}>{messages.common.accept}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  inbox: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2f3336",
  },
  wrap: {
    gap: 10,
  },
  compact: {
    gap: 0,
  },
  panelInner: {
    paddingTop: 10,
    gap: 12,
    backgroundColor: "#16181c",
  },
  kicker: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
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
  more: {
    fontSize: 13,
    fontWeight: "600",
  },
  morePad: {
    marginTop: 8,
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
