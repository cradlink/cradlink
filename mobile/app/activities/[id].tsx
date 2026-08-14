import { StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"

import { ActivityCover } from "@/components/ActivityCover"
import { Avatar } from "@/components/Avatar"
import { EditPencil } from "@/components/EditPencil"
import { EmptyState } from "@/components/EmptyState"
import { JoinButton } from "@/components/JoinButton"
import { LookingForChips } from "@/components/LookingForChips"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { TypeBadge } from "@/components/TypeBadge"
import { Text, View } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useMemberships } from "@/hooks/use-memberships"
import { formatActivityWhen, formatHeadcount, formatJoinPolicy, formatLocation } from "@/lib/format"

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { get } = useActivities()
  const { decorate, isOrganizer } = useMemberships()
  const activity = id ? get(id) : null
  const viewed = activity ? decorate(activity) : null

  return (
    <Refreshable contentContainerStyle={styles.content}>
      <Stagger>
        {!activity || !viewed ? (
          <EmptyState
            key="missing"
            title="Activity not found."
            body="It may have been removed, or this is a stale link."
          />
        ) : (
          [
            <View key="byline" style={styles.byline}>
              <Avatar name={activity.creatorName} src={activity.creatorAvatar} />
              <View style={styles.bylineText}>
                <Text style={styles.creator}>{activity.creatorName}</Text>
                <TypeBadge type={activity.type} />
              </View>
              {isOrganizer(activity) ? <EditPencil activityId={activity.id} /> : null}
            </View>,
            <Text key="title" style={styles.title}>
              {activity.title}
            </Text>,
            <Text key="body" style={styles.body}>
              {activity.description}
            </Text>,
            activity.lookingFor.length > 0 ? (
              <LookingForChips key="looking" items={activity.lookingFor} limit={8} />
            ) : null,
            <Text key="place" style={styles.meta} lightColor="#536471" darkColor="#71767b">
              {formatLocation(activity)}
            </Text>,
            <Text key="when" style={styles.meta} lightColor="#536471" darkColor="#71767b">
              {formatActivityWhen(activity)}
            </Text>,
            <Text key="people" style={styles.meta} lightColor="#536471" darkColor="#71767b">
              {formatHeadcount(viewed)} · {formatJoinPolicy(activity.joinPolicy)}
            </Text>,
            <ActivityCover key="cover" activity={activity} compact={false} />,
            <View key="action" style={styles.action}>
              <JoinButton activity={activity} />
            </View>,
          ]
        )}
      </Stagger>
    </Refreshable>
  )
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  byline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "transparent",
  },
  bylineText: {
    flex: 1,
    gap: 6,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
    marginTop: 14,
  },
  creator: {
    fontSize: 15,
    fontWeight: "600",
  },
  body: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 18,
  },
  action: {
    marginTop: 16,
    alignItems: "flex-end",
    backgroundColor: "transparent",
  },
})
