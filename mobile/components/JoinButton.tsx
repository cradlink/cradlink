import { Alert, Pressable, StyleSheet } from "react-native"

import { Text, useTheme } from "@/components/Themed"
import { useMemberships } from "@/hooks/use-memberships"
import type { Activity } from "@/lib/types"

export function JoinButton({ activity }: { activity: Activity }) {
  const theme = useTheme()
  const { statusOf, isOrganizer, isFull, join, leave } = useMemberships()
  const organizer = isOrganizer(activity)
  const status = statusOf(activity.id)
  const full = isFull(activity)
  const manual = activity.joinPolicy === "manual"

  if (organizer) {
    return <Pill label="Yours" muted />
  }

  if (status === "pending") {
    return (
      <Pill
        label="Requested"
        outline
        onPress={() => {
          Alert.alert("Withdraw request?", "The organizer won’t see this request anymore.", [
            { text: "Keep it", style: "cancel" },
            { text: "Withdraw", onPress: () => void leave(activity.id) },
          ])
        }}
      />
    )
  }

  if (status === "joined") {
    return (
      <Pill
        label="Leave"
        outline
        onPress={() => {
          Alert.alert("Leave this activity?", "You can join again later if there’s still a spot.", [
            { text: "Stay", style: "cancel" },
            { text: "Leave", style: "destructive", onPress: () => void leave(activity.id) },
          ])
        }}
      />
    )
  }

  if (full) {
    return <Pill label="Full" muted />
  }

  return (
    <Pill
      label={manual ? "Request" : "Join"}
      filled
      onPress={() => {
        Alert.alert(
          manual ? `Request to join ${activity.title}?` : `Join ${activity.title}?`,
          manual
            ? "The organizer will accept or decline. You’ll see Requested until they do."
            : "You’ll be on the list. The organizer can see your name.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: manual ? "Send request" : "Join",
              onPress: () => void join(activity),
            },
          ],
        )
      }}
    />
  )
}

function Pill({
  label,
  filled,
  outline,
  muted,
  onPress,
}: {
  label: string
  filled?: boolean
  outline?: boolean
  muted?: boolean
  onPress?: () => void
}) {
  const theme = useTheme()
  const backgroundColor = filled ? theme.foreground : "transparent"
  const borderColor = filled ? theme.foreground : muted ? "transparent" : theme.border
  const color = filled ? theme.background : muted ? theme.mutedForeground : theme.foreground

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor,
          borderColor,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-end",
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
})
