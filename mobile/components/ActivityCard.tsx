import { useRef } from "react"
import { Pressable, StyleSheet, View as RNView } from "react-native"
import { useRouter } from "expo-router"

import { ActivityCover } from "@/components/ActivityCover"
import { Avatar } from "@/components/Avatar"
import { CreatorPress } from "@/components/CreatorPress"
import { EditPencil } from "@/components/EditPencil"
import { LookingForChips } from "@/components/LookingForChips"
import { ReplyRow } from "@/components/ReplyRow"
import { ThreadRail, THREAD_AVATAR } from "@/components/ThreadRail"
import { TypeBadge } from "@/components/TypeBadge"
import { Text, View, useTheme } from "@/components/Themed"
import { useActivityPreview } from "@/hooks/use-activity-preview"
import { useI18n } from "@/hooks/use-i18n"
import { useMemberships } from "@/hooks/use-memberships"
import { useReplies } from "@/hooks/use-replies"
import { formatCardMeta } from "@/lib/format"
import type { Activity } from "@/lib/types"

const REPLY_CAP = 3

export function ActivityCard({ activity }: { activity: Activity }) {
  const theme = useTheme()
  const router = useRouter()
  const { decorate, isOrganizer } = useMemberships()
  const { threadFor, openCompose } = useReplies()
  const { open } = useActivityPreview()
  const { messages } = useI18n()
  const viewed = decorate(activity)
  const mine = isOrganizer(activity)
  const ref = useRef<RNView>(null)
  const thread = threadFor(activity.id)
  const visible = thread.slice(0, REPLY_CAP)

  function openPreview() {
    ref.current?.measureInWindow((x, y, width, height) => {
      open(activity, { x, y, width, height })
    })
  }

  function openThread() {
    router.push(`/activities/replies/${activity.id}`)
  }

  return (
    <RNView ref={ref} collapsable={false} style={[styles.thread, { borderBottomColor: theme.border }]}>
      <Pressable
        onPress={openPreview}
        style={({ pressed }) => [styles.card, { backgroundColor: pressed ? theme.hover : "transparent" }]}
      >
        <ThreadRail lineDown={visible.length > 0}>
          <CreatorPress userId={activity.creatorId}>
            <Avatar name={activity.creatorName} src={activity.creatorAvatar} size={THREAD_AVATAR} />
          </CreatorPress>
        </ThreadRail>
        <View style={styles.body}>
          <View style={styles.meta}>
            <CreatorPress userId={activity.creatorId}>
              <Text style={styles.creator} numberOfLines={1}>
                {activity.creatorName}
              </Text>
            </CreatorPress>
            <TypeBadge type={activity.type} />
            {mine ? (
              <>
                <View style={styles.grow} />
                <EditPencil activityId={activity.id} />
              </>
            ) : null}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {activity.title}
          </Text>
          <Text style={styles.copy} numberOfLines={2}>
            {activity.description}
          </Text>

          {activity.lookingFor.length > 0 ? (
            <View style={styles.chips}>
              <LookingForChips items={activity.lookingFor} limit={3} />
            </View>
          ) : null}

          <View style={styles.cover}>
            <ActivityCover activity={activity} />
          </View>

          <Text style={styles.detail} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
            {formatCardMeta(viewed)}
          </Text>

          <Pressable
            onPress={() => openCompose(activity)}
            hitSlop={8}
            accessibilityLabel={messages.reply.action}
            style={({ pressed }) => [styles.replyAction, { opacity: pressed ? 0.65 : 1 }]}
          >
            <Text style={styles.replyLabel} lightColor="#536471" darkColor="#71767b">
              {messages.reply.action}
            </Text>
          </Pressable>
        </View>
      </Pressable>

      {visible.map((item, index) => {
        const prev = index > 0 ? visible[index - 1] : null
        const next = visible[index + 1]
        const fromPrev = index === 0 || prev?.reply.id === item.reply.parentId
        return (
          <ReplyRow
            key={item.reply.id}
            activity={activity}
            reply={item.reply}
            parent={item.parent}
            lineDown={next?.reply.parentId === item.reply.id}
            split={index > 0 && !fromPrev}
          />
        )
      })}

      {thread.length > REPLY_CAP ? (
        <Pressable onPress={openThread} hitSlop={8} style={styles.moreWrap}>
          <Text style={styles.more}>
            {messages.reply.viewAll}
          </Text>
        </Pressable>
      ) : null}
    </RNView>
  )
}

const styles = StyleSheet.create({
  thread: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 0,
  },
  body: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingBottom: 6,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: THREAD_AVATAR,
    backgroundColor: "transparent",
  },
  grow: {
    flex: 1,
    backgroundColor: "transparent",
  },
  creator: {
    flexShrink: 1,
    lineHeight: 20,
    fontSize: 15,
    fontWeight: "700",
  },
  title: {
    marginTop: 6,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  copy: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 19,
  },
  chips: {
    marginTop: 10,
    backgroundColor: "transparent",
  },
  cover: {
    marginTop: 10,
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },
  detail: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 16,
  },
  replyAction: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginRight: 12,
    minHeight: 20,
    justifyContent: "center",
  },
  replyLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  moreWrap: {
    paddingLeft: 62,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 12,
    alignSelf: "flex-start",
  },
  more: {
    fontSize: 14,
    fontWeight: "800",
  },
})
