import { Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

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
      style={({ pressed }) => [styles.card, { borderBottomColor: theme.border, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.meta} lightColor="transparent" darkColor="transparent">
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
      <Text style={styles.body} numberOfLines={4}>
        {activity.description}
      </Text>

      <Text style={styles.detail} lightColor="#536471" darkColor="#71767b">
        {formatLocation(activity)}
      </Text>
      <Text style={styles.detail} lightColor="#536471" darkColor="#71767b">
        {formatActivityWhen(activity)}
      </Text>
      <Text style={styles.detail} lightColor="#536471" darkColor="#71767b">
        {formatHeadcount(activity)} · {formatJoinPolicy(activity.joinPolicy)}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    marginTop: 6,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  body: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 20,
  },
  detail: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 16,
  },
})
