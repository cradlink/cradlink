import { Keyboard, Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { ActivityCover } from "@/components/ActivityCover"
import { Avatar } from "@/components/Avatar"
import { JoinButton } from "@/components/JoinButton"
import { LookingForChips } from "@/components/LookingForChips"
import { TypeBadge } from "@/components/TypeBadge"
import { Text, View, useTheme } from "@/components/Themed"
import { useMemberships } from "@/hooks/use-memberships"
import { formatCardMeta } from "@/lib/format"
import type { Activity } from "@/lib/types"

export function ActivityCard({ activity }: { activity: Activity }) {
  const router = useRouter()
  const theme = useTheme()
  const { decorate } = useMemberships()
  const viewed = decorate(activity)

  return (
    <Pressable
      onPress={() => {
        Keyboard.dismiss()
        router.push(`/activities/${activity.id}`)
      }}
      style={({ pressed }) => [
        styles.card,
        { borderBottomColor: theme.border, backgroundColor: pressed ? theme.hover : "transparent" },
      ]}
    >
      <Avatar name={activity.creatorName} src={activity.creatorAvatar} size={36} />
      <View style={styles.body}>
        <View style={styles.meta}>
          <Text style={styles.creator} numberOfLines={1}>
            {activity.creatorName}
          </Text>
          <TypeBadge type={activity.type} />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {activity.title}
        </Text>
        <Text style={styles.copy} numberOfLines={2}>
          {activity.description}
        </Text>

        {activity.lookingFor.length > 0 ? (
          <View style={styles.chips}>
            <LookingForChips items={activity.lookingFor} limit={3} />
          </View>
        ) : null}

        <View style={styles.cover}>
          <ActivityCover activity={activity} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.detail} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
            {formatCardMeta(viewed)}
          </Text>
          <JoinButton activity={activity} />
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  body: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "transparent",
  },
  creator: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  title: {
    marginTop: 6,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  copy: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 19,
  },
  chips: {
    marginTop: 10,
    backgroundColor: "transparent",
  },
  cover: {
    marginTop: 10,
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },
  footer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "transparent",
  },
  detail: {
    flex: 1,
    fontSize: 13,
    lineHeight: 16,
  },
})
