import { Pressable, StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Avatar } from "@/components/Avatar"
import { CreatorPress } from "@/components/CreatorPress"
import { EmptyState } from "@/components/EmptyState"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { ReplyRow } from "@/components/ReplyRow"
import { ScreenBlurTarget } from "@/components/ScreenBlurTarget"
import { ThreadRail, THREAD_AVATAR } from "@/components/ThreadRail"
import { Text, View, useTheme } from "@/components/Themed"
import { TopBar } from "@/components/TopBar"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { useReplies } from "@/hooks/use-replies"
import type { Activity } from "@/lib/types"

export default function ActivityRepliesScreen() {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { get } = useActivities()
  const { threadFor, openCompose } = useReplies()
  const { messages, tx } = useI18n()
  const activity = id ? get(id) : null
  const thread = activity ? threadFor(activity.id) : []

  return (
    <ScreenBlurTarget style={styles.screen}>
      <TopBar title={messages.reply.title} back hideBell />
      <Refreshable contentContainerStyle={styles.list}>
        <Stagger>
          {!activity ? (
            <EmptyState
              key="missing"
              title={messages.activity.notFoundTitle}
              body={messages.activity.notFoundBody}
            />
          ) : thread.length === 0 ? (
            [
              <ParentPost key="parent" activity={activity} count={0} />,
              <EmptyState
                key="empty"
                title={messages.reply.emptyTitle}
                body={messages.reply.emptyBody}
                icon={{ ios: "bubble.left", android: "chat_bubble_outline", web: "chat_bubble_outline" }}
              />,
            ]
          ) : (
            [
              <ParentPost key="parent" activity={activity} count={thread.length} />,
              ...thread.map((item, index) => {
                const prev = index > 0 ? thread[index - 1] : null
                const next = thread[index + 1]
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
              }),
            ]
          )}
        </Stagger>
      </Refreshable>
      {activity ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12), borderTopColor: theme.border }]}>
          <Avatar name={user?.displayName ?? messages.common.you} src={user?.avatarUrl} size={36} />
          <Pressable
            onPress={() => openCompose(activity)}
            style={({ pressed }) => [styles.compose, { borderColor: theme.border, opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={styles.composeLabel} lightColor="#536471" darkColor="#71767b">
              {messages.reply.placeholder}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </ScreenBlurTarget>
  )
}

function ParentPost({ activity, count }: { activity: Activity; count: number }) {
  const { openCompose } = useReplies()
  const { messages, tx } = useI18n()

  return (
    <View style={styles.parent}>
      <ThreadRail lineDown={count > 0}>
        <CreatorPress userId={activity.creatorId}>
          <Avatar name={activity.creatorName} src={activity.creatorAvatar} size={THREAD_AVATAR} />
        </CreatorPress>
      </ThreadRail>
      <View style={styles.parentBody}>
        <Text style={styles.parentName} numberOfLines={1}>
          {activity.creatorName}
        </Text>
        <Text style={styles.parentTitle} numberOfLines={2}>
          {activity.title}
        </Text>
        <Text style={styles.count} lightColor="#536471" darkColor="#71767b">
          {count === 1 ? messages.reply.one : tx(messages.reply.many, { count })}
        </Text>
        <Pressable
          onPress={() => openCompose(activity)}
          hitSlop={8}
          style={({ pressed }) => [styles.parentReply, { opacity: pressed ? 0.65 : 1 }]}
        >
          <Text style={styles.parentReplyLabel} lightColor="#536471" darkColor="#71767b">
            {messages.reply.action}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  parent: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "transparent",
  },
  parentBody: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 6,
    backgroundColor: "transparent",
  },
  parentName: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    minHeight: THREAD_AVATAR,
  },
  parentTitle: {
    marginTop: 2,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  count: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 16,
  },
  parentReply: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginRight: 12,
    minHeight: 20,
    justifyContent: "center",
  },
  parentReplyLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  compose: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  composeLabel: {
    fontSize: 15,
  },
})
