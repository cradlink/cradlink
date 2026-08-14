import { Pressable, StyleSheet } from "react-native"

import { Text, useTheme } from "@/components/Themed"
import { useConfirm } from "@/hooks/use-confirm"
import { useMemberships } from "@/hooks/use-memberships"
import type { Activity } from "@/lib/types"

export function JoinButton({ activity, wide = false }: { activity: Activity; wide?: boolean }) {
  const { ask } = useConfirm()
  const { statusOf, isOrganizer, isFull, join, leave } = useMemberships()
  const organizer = isOrganizer(activity)
  const status = statusOf(activity.id)
  const full = isFull(activity)
  const manual = activity.joinPolicy === "manual"

  if (organizer) {
    return <Action label="Your activity" muted wide={wide} />
  }

  if (full && status !== "joined" && status !== "pending") {
    return <Action label="Full" muted wide={wide} />
  }

  if (status === "pending") {
    return (
      <Action
        label="Requested"
        outline
        wide={wide}
        onPress={() =>
          ask({
            title: "Withdraw request?",
            body: "The organizer won’t see this request anymore.",
            confirmLabel: "Withdraw",
            cancelLabel: "Keep it",
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
        label="Leave"
        outline
        wide={wide}
        onPress={() =>
          ask({
            title: "Leave this activity?",
            body: "You can join again later if there’s still a spot.",
            confirmLabel: "Leave",
            cancelLabel: "Stay",
            destructive: true,
            onConfirm: () => void leave(activity.id),
          })
        }
      />
    )
  }

  return (
    <Action
      label={manual ? "Request to join" : "Join"}
      filled
      wide={wide}
      onPress={() =>
        ask({
          title: manual ? "Request to join?" : "Join this activity?",
          body: manual
            ? "The organizer will accept or decline. You’ll see Requested until they do."
            : "You’ll be on the list. The organizer can see your name.",
          confirmLabel: manual ? "Send request" : "Join",
          onConfirm: () => void join(activity),
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
