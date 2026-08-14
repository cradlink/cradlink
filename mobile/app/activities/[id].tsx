import { ScrollView, StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"

import { EmptyState } from "@/components/EmptyState"
import { TypeBadge } from "@/components/TypeBadge"
import { Text, View } from "@/components/Themed"
import { formatActivityWhen, formatHeadcount, formatJoinPolicy, formatLocation } from "@/lib/format"
import { getActivity } from "@/lib/mock"

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const activity = id ? getActivity(id) : null

  if (!activity) {
    return (
      <View style={styles.screen}>
        <EmptyState title="Activity not found." body="It may have been removed, or this is a stale link." />
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TypeBadge type={activity.type} />
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.creator}>{activity.creatorName}</Text>
      <Text style={styles.body}>{activity.description}</Text>
      <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
        {formatLocation(activity)}
      </Text>
      <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
        {formatActivityWhen(activity)}
      </Text>
      <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
        {formatHeadcount(activity)} · {formatJoinPolicy(activity.joinPolicy)}
      </Text>
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
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
    marginTop: 8,
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
})
