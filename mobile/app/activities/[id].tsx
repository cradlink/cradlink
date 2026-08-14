import { ScrollView, StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"

import { ActivityCover } from "@/components/ActivityCover"
import { Avatar } from "@/components/Avatar"
import { EmptyState } from "@/components/EmptyState"
import { JoinButton } from "@/components/JoinButton"
import { LookingForChips } from "@/components/LookingForChips"
import { TypeBadge } from "@/components/TypeBadge"
import { Text, View } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useMemberships } from "@/hooks/use-memberships"
import { formatActivityWhen, formatHeadcount, formatJoinPolicy, formatLocation } from "@/lib/format"

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { get } = useActivities()
  const { decorate } = useMemberships()
  const activity = id ? get(id) : null
  const viewed = activity ? decorate(activity) : null

  if (!activity || !viewed) {
    return (
      <View style={styles.screen}>
        <EmptyState title="Activity not found." body="It may have been removed, or this is a stale link." />
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.byline}>
        <Avatar name={activity.creatorName} src={activity.creatorAvatar} />
        <View style={styles.bylineText}>
          <Text style={styles.creator}>{activity.creatorName}</Text>
          <TypeBadge type={activity.type} />
        </View>
      </View>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.body}>{activity.description}</Text>
      {activity.lookingFor.length > 0 ? <LookingForChips items={activity.lookingFor} limit={8} /> : null}
      <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
        {formatLocation(activity)}
      </Text>
      <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
        {formatActivityWhen(activity)}
      </Text>
      <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
        {formatHeadcount(viewed)} · {formatJoinPolicy(activity.joinPolicy)}
      </Text>
      <ActivityCover activity={activity} compact={false} />
      <View style={styles.action}>
        <JoinButton activity={activity} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 10,
  },
  byline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "transparent",
  },
  bylineText: {
    gap: 6,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
    marginTop: 4,
  },
  creator: {
    fontSize: 15,
    fontWeight: "600",
  },
  body: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    fontSize: 14,
    lineHeight: 18,
  },
  action: {
    marginTop: 8,
    alignItems: "flex-end",
    backgroundColor: "transparent",
  },
})
