import { StyleSheet } from "react-native"

import { ActivityCover } from "@/components/ActivityCover"
import { ActivityPressable, listHairline } from "@/components/ActivityPressable"
import { EditPencil } from "@/components/EditPencil"
import { TypeBadge } from "@/components/TypeBadge"
import { Text, View, useTheme } from "@/components/Themed"
import { formatHeadcount, formatJoinPolicy } from "@/lib/format"
import { formatPlace, formatShortWhen } from "@/lib/schedule"
import type { Activity } from "@/lib/types"

export function HostCard({ activity }: { activity: Activity }) {
  const theme = useTheme()
  const status =
    activity.status === "full" ? "Full" : activity.status === "cancelled" ? "Cancelled" : activity.status === "completed" ? "Done" : null

  return (
    <ActivityPressable activity={activity} style={[styles.card, { borderBottomColor: theme.border }]}>
      <ActivityCover activity={activity} />
      <View style={styles.meta} lightColor="transparent" darkColor="transparent">
        <TypeBadge type={activity.type} />
        {status ? (
          <Text style={styles.status} lightColor="#536471" darkColor="#71767b">
            {status}
          </Text>
        ) : null}
        <View style={styles.grow} lightColor="transparent" darkColor="transparent" />
        <EditPencil activityId={activity.id} />
      </View>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.when}>{formatShortWhen(activity)}</Text>
      <Text style={styles.line} lightColor="#536471" darkColor="#71767b">
        {formatPlace(activity)}
      </Text>
      <Text style={styles.line} lightColor="#536471" darkColor="#71767b">
        {formatHeadcount(activity)} · {formatJoinPolicy(activity.joinPolicy)}
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
    gap: 8,
  },
  grow: {
    flex: 1,
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
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
