import { useRef } from "react"
import { Pressable, StyleSheet, View as RNView } from "react-native"

import { ActivityCover } from "@/components/ActivityCover"
import { Avatar } from "@/components/Avatar"
import { EditPencil } from "@/components/EditPencil"
import { LookingForChips } from "@/components/LookingForChips"
import { TypeBadge } from "@/components/TypeBadge"
import { Text, View, useTheme } from "@/components/Themed"
import { useActivityPreview } from "@/hooks/use-activity-preview"
import { useMemberships } from "@/hooks/use-memberships"
import { formatCardMeta } from "@/lib/format"
import type { Activity } from "@/lib/types"

export function ActivityCard({ activity }: { activity: Activity }) {
  const theme = useTheme()
  const { decorate, isOrganizer } = useMemberships()
  const { open } = useActivityPreview()
  const viewed = decorate(activity)
  const mine = isOrganizer(activity)
  const ref = useRef<RNView>(null)

  return (
    <RNView ref={ref} collapsable={false}>
      <Pressable
        onPress={() => {
          ref.current?.measureInWindow((x, y, width, height) => {
            open(activity, { x, y, width, height })
          })
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
            {mine ? (
              <>
                <View style={styles.grow} />
                <EditPencil activityId={activity.id} />
              </>
            ) : null}
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

          <Text style={styles.detail} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
            {formatCardMeta(viewed)}
          </Text>
        </View>
      </Pressable>
    </RNView>
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
  grow: {
    flex: 1,
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
  detail: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 16,
  },
})
