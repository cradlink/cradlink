import { Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Text, useTheme } from "@/components/Themed"
import { useActivityPreview } from "@/hooks/use-activity-preview"
import { useConfirm } from "@/hooks/use-confirm"
import { useMemberships } from "@/hooks/use-memberships"
import { useNotifications } from "@/hooks/use-notifications"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { isActivityPast } from "@/lib/schedule"
import type { Activity } from "@/lib/types"

export function JoinButton({ activity, wide = false }: { activity: Activity; wide?: boolean }) {
  const router = useRouter()
  const { ask } = useConfirm()
  const { preview, dismiss } = useActivityPreview()
  const { show } = useToast()
  const { messages } = useI18n()
  const { notifyHost } = useNotifications()
  const { statusOf, isOrganizer, isFull, join, leave } = useMemberships()
  const organizer = isOrganizer(activity)
  const status = statusOf(activity.id)
  const full = isFull(activity)
  const manual = activity.joinPolicy === "manual"

  if (isActivityPast(activity) && !organizer && status !== "joined" && status !== "pending") {
    return null
  }

  if (organizer) {
    return (
      <Action
        label={messages.join.edit}
        outline
        wide={wide}
        onPress={() => {
          if (preview?.activity.id === activity.id) dismiss()
          router.push(`/activities/edit/${activity.id}`)
        }}
      />
    )
  }

  if (full && status !== "joined" && status !== "pending") {
    return <Action label={messages.join.full} muted wide={wide} />
  }

  if (status === "pending") {
    return (
      <Action
        label={messages.join.requested}
        outline
        wide={wide}
        onPress={() =>
          ask({
            title: messages.join.withdrawTitle,
            body: messages.join.withdrawBody,
            confirmLabel: messages.join.withdraw,
            cancelLabel: messages.join.keepIt,
            destructive: true,
            onConfirm: () => void leave(activity.id),
          })
        }
      />
    )
  }

  if (status === "joined") {
    return (
      <Action
        label={messages.join.leave}
        outline
        wide={wide}
        onPress={() =>
          ask({
            title: messages.join.leaveTitle,
            body: messages.join.leaveBody,
            confirmLabel: messages.join.leave,
            cancelLabel: messages.join.stay,
            destructive: true,
            onConfirm: () => void leave(activity.id),
          })
        }
      />
    )
  }

  return (
    <Action
      label={manual ? messages.join.request : messages.join.join}
      filled
      wide={wide}
      onPress={() =>
        ask({
          title: manual ? messages.join.requestTitle : messages.join.joinTitle,
          body: manual ? messages.join.requestBody : messages.join.joinBody,
          confirmLabel: manual ? messages.join.sendRequest : messages.join.join,
          onConfirm: () => {
            void (async () => {
              try {
                await join(activity)
                await notifyHost(activity, manual ? "request" : "joined")
                if (preview?.activity.id === activity.id) dismiss()
                show({ title: manual ? messages.join.requestSent : messages.join.joined })
              } catch {
                show({ title: manual ? messages.join.couldntRequest : messages.join.couldntJoin, tone: "error" })
              }
            })()
          },
        })
      }
    />
  )
}

function Action({
  label,
  filled,
  outline,
  muted,
  wide,
  onPress,
}: {
  label: string
  filled?: boolean
  outline?: boolean
  muted?: boolean
  wide?: boolean
  onPress?: () => void
}) {
  const theme = useTheme()
  const backgroundColor = filled ? theme.foreground : "transparent"
  const borderColor = filled ? theme.foreground : outline || wide ? theme.border : "transparent"
  const color = filled ? theme.background : muted ? theme.mutedForeground : theme.foreground

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        wide ? styles.wide : styles.inline,
        {
          backgroundColor,
          borderColor,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={[wide ? styles.wideLabel : styles.inlineLabel, { color }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  inline: {
    paddingVertical: 2,
    paddingLeft: 8,
  },
  inlineLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  wide: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  wideLabel: {
    fontSize: 17,
    fontWeight: "800",
  },
})
