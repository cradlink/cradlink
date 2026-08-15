import { Pressable, StyleSheet } from "react-native"
import { SymbolView } from "expo-symbols"

import { Avatar } from "@/components/Avatar"
import { CreatorPress } from "@/components/CreatorPress"
import { ThreadRail, THREAD_AVATAR } from "@/components/ThreadRail"
import { Text, View, useTheme } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useConfirm } from "@/hooks/use-confirm"
import { useI18n } from "@/hooks/use-i18n"
import { useReplies } from "@/hooks/use-replies"
import { useToast } from "@/hooks/use-toast"
import { formatCompactAgo } from "@/lib/format"
import type { Activity, ActivityReply } from "@/lib/types"

export function ReplyRow({
  activity,
  reply,
  parent,
  lineDown = false,
  split = false,
}: {
  activity: Activity
  reply: ActivityReply
  parent?: ActivityReply | null
  lineDown?: boolean
  split?: boolean
}) {
  const theme = useTheme()
  const { user } = useAuth()
  const { hide, openCompose } = useReplies()
  const { ask } = useConfirm()
  const { show } = useToast()
  const { messages, tx } = useI18n()
  const mine = Boolean(user && reply.userId === user.id)
  const host = Boolean(user && activity.creatorId === user.id)
  const gone = Boolean(reply.deleted)
  const canRemove = !gone && (mine || host)

  function askDelete() {
    if (!canRemove) return
    ask({
      title: messages.reply.hideTitle,
      body: messages.reply.hideBody,
      confirmLabel: messages.common.delete,
      destructive: true,
      onConfirm: () => {
        void hide(reply.id, activity).then(() => show({ title: messages.reply.deleted }))
      },
    })
  }

  return (
    <Pressable
      onLongPress={askDelete}
      delayLongPress={380}
      style={[styles.row, split && styles.split]}
    >
      <ThreadRail lineDown={lineDown}>
        <CreatorPress userId={reply.userId}>
          <Avatar name={reply.userName} src={reply.userAvatar} size={THREAD_AVATAR} />
        </CreatorPress>
      </ThreadRail>
      <View style={styles.body}>
        <View style={styles.meta}>
          <CreatorPress userId={reply.userId}>
            <Text style={styles.name} numberOfLines={1}>
              {reply.userName}
            </Text>
          </CreatorPress>
          <Text style={styles.ago} lightColor="#536471" darkColor="#71767b">
            {formatCompactAgo(reply.createdAt)}
          </Text>
        </View>
        {gone ? (
          <Text style={styles.removed} lightColor="#536471" darkColor="#71767b">
            {reply.deletedBy === "host"
              ? tx(messages.reply.removedBy, { name: activity.creatorName })
              : messages.reply.removed}
          </Text>
        ) : (
          <>
            {parent ? (
              <Text style={styles.to} lightColor="#536471" darkColor="#71767b" numberOfLines={1}>
                {tx(messages.reply.replyingTo, { name: parent.userName })}
              </Text>
            ) : null}
            <Text style={styles.copy}>{reply.body}</Text>
            <View style={styles.actions}>
              {canRemove ? (
                <Pressable
                  onPress={askDelete}
                  hitSlop={8}
                  accessibilityLabel={messages.common.delete}
                  style={({ pressed }) => [styles.trash, { opacity: pressed ? 0.65 : 1 }]}
                >
                  <SymbolView
                    name={{ ios: "trash", android: "delete", web: "delete" }}
                    tintColor={theme.mutedForeground}
                    size={15}
                  />
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => openCompose(activity, reply)}
                hitSlop={8}
                accessibilityLabel={messages.reply.action}
                style={({ pressed }) => [styles.action, { opacity: pressed ? 0.65 : 1 }]}
              >
                <Text style={[styles.actionLabel, { color: theme.mutedForeground }]}>{messages.reply.action}</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    paddingHorizontal: 16,
  },
  split: {
    marginTop: 10,
  },
  body: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingBottom: 6,
    backgroundColor: "transparent",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: THREAD_AVATAR,
    backgroundColor: "transparent",
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  ago: {
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 4,
    marginRight: 12,
    gap: 8,
  },
  trash: {
    width: 22,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  to: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 16,
  },
  copy: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 20,
  },
  removed: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 20,
    fontStyle: "italic",
  },
  action: {
    minHeight: 20,
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
})
