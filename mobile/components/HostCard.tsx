import { StyleSheet } from "react-native"

import { ActivityCover } from "@/components/ActivityCover"
import { ActivityPressable, listHairline } from "@/components/ActivityPressable"
import { EditPencil } from "@/components/EditPencil"
import { MetaPill, TypeBadge } from "@/components/TypeBadge"
import { Text, View, useTheme } from "@/components/Themed"
import { useI18n } from "@/hooks/use-i18n"
import { useMemberships } from "@/hooks/use-memberships"
import { formatHeadcount, formatJoinPolicy } from "@/lib/format"
import { formatPlace, formatShortWhen } from "@/lib/schedule"
import type { Activity } from "@/lib/types"

export function HostCard({ activity }: { activity: Activity }) {
  const theme = useTheme()
  const { pendingCount, decorate } = useMemberships()
  const { messages, tx } = useI18n()
  const viewed = decorate(activity)
  const waiting = pendingCount(activity.id)
  const status =
    activity.status === "full"
      ? messages.status.full
      : activity.status === "cancelled"
        ? messages.status.cancelled
        : activity.status === "completed"
          ? messages.status.completed
          : null

  return (
    <ActivityPressable activity={activity} style={[styles.card, { borderBottomColor: theme.border }]}>
      <ActivityCover activity={activity} />
      <View style={styles.meta} lightColor="transparent" darkColor="transparent">
        <View style={styles.chips} lightColor="transparent" darkColor="transparent">
          <TypeBadge type={activity.type} />
          {waiting > 0 ? (
            <MetaPill
              label={waiting === 1 ? messages.requests.oneWaiting : tx(messages.requests.manyWaiting, { count: waiting })}
              color={theme.primary}
            />
          ) : status ? (
            <MetaPill label={status} color={theme.mutedForeground} />
          ) : null}
        </View>
        <View style={styles.grow} lightColor="transparent" darkColor="transparent" />
        <EditPencil activityId={activity.id} />
      </View>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.when}>{formatShortWhen(activity)}</Text>
      <Text style={styles.line} lightColor="#536471" darkColor="#71767b">
        {formatPlace(activity)}
      </Text>
      <Text style={styles.line} lightColor="#536471" darkColor="#71767b">
        {formatHeadcount(viewed)} · {formatJoinPolicy(activity.joinPolicy)}
      </Text>
    </ActivityPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: listHairline,
    gap: 8,
  },
  meta: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 32,
  },
  chips: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  grow: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  when: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  line: {
    fontSize: 14,
    lineHeight: 18,
  },
})
