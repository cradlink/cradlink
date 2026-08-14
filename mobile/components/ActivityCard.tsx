import { Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { ActivityCover } from "@/components/ActivityCover"
import { Avatar } from "@/components/Avatar"
import { LookingForChips } from "@/components/LookingForChips"
import { TypeBadge } from "@/components/TypeBadge"
import { Text, View, useTheme } from "@/components/Themed"
import { LOCATION_LABELS } from "@/lib/activity-meta"
import { formatActivityWhen, formatHeadcount, formatJoinPolicy, formatLocation } from "@/lib/format"
import type { Activity } from "@/lib/types"

export function ActivityCard({ activity }: { activity: Activity }) {
  const router = useRouter()
  const theme = useTheme()

  return (
    <Pressable
      onPress={() => router.push(`/activities/${activity.id}`)}
      style={({ pressed }) => [
        styles.card,
        { borderBottomColor: theme.border, backgroundColor: pressed ? theme.hover : "transparent" },
      ]}
    >
      <Avatar name={activity.creatorName} src={activity.creatorAvatar} />
      <View style={styles.body}>
        <View style={styles.meta}>
          <Text style={styles.creator}>{activity.creatorName}</Text>
          <Text style={styles.dot} lightColor="#536471" darkColor="#71767b">
            ·
          </Text>
          <TypeBadge type={activity.type} />
          <Text style={styles.place} lightColor="#536471" darkColor="#71767b">
            {LOCATION_LABELS[activity.location.type]}
            {activity.status === "full" ? " · Full" : ""}
          </Text>
        </View>

        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.copy} numberOfLines={4}>
          {activity.description}
        </Text>

        {activity.tags?.length ? <LookingForChips items={activity.tags} limit={5} /> : null}
        {activity.lookingFor.length > 0 ? <LookingForChips items={activity.lookingFor} limit={4} /> : null}

        <Text style={styles.detail} lightColor="#536471" darkColor="#71767b">
          {formatLocation(activity)}
        </Text>
        <Text style={styles.detail} lightColor="#536471" darkColor="#71767b">
          {formatActivityWhen(activity)}
        </Text>
        <Text style={styles.detail} lightColor="#536471" darkColor="#71767b">
          {formatHeadcount(activity)} · {formatJoinPolicy(activity.joinPolicy)}
        </Text>

        <View style={styles.cover}>
          <ActivityCover activity={activity} />
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  body: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    gap: 6,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    backgroundColor: "transparent",
  },
  creator: {
    fontSize: 15,
    fontWeight: "700",
  },
  dot: {
    fontSize: 15,
  },
  place: {
    fontSize: 13,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  copy: {
    fontSize: 15,
    lineHeight: 20,
  },
  detail: {
    fontSize: 13,
    lineHeight: 16,
  },
  cover: {
    marginTop: 6,
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },
})
