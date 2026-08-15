import { useEffect, useState } from "react"
import { Image, StyleSheet } from "react-native"

import { ActivityCover } from "@/components/ActivityCover"
import { ActivityPressable, listHairline } from "@/components/ActivityPressable"
import { CreatorPress } from "@/components/CreatorPress"
import { TypeBadge } from "@/components/TypeBadge"
import { Text, View, useTheme } from "@/components/Themed"
import { useI18n } from "@/hooks/use-i18n"
import { ACTIVITY_META } from "@/lib/activity-meta"
import { formatHeadcount } from "@/lib/format"
import { activityBannerSources } from "@/lib/banners"
import { formatClock, formatDateParts, formatPlace, formatShortWhen } from "@/lib/schedule"
import type { Activity } from "@/lib/types"

export function AgendaSection({ title }: { title: string }) {
  return (
    <View style={styles.section} lightColor="transparent" darkColor="transparent">
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

export function AgendaHero({
  activity,
  pending = false,
}: {
  activity: Activity
  pending?: boolean
}) {
  const theme = useTheme()
  const { messages } = useI18n()

  return (
    <ActivityPressable activity={activity} style={[styles.hero, { borderBottomColor: theme.border }]}>
      <ActivityCover activity={activity} />
      <View style={styles.heroMeta} lightColor="transparent" darkColor="transparent">
        <TypeBadge type={activity.type} />
        {pending ? <StatusPill label={messages.join.requested} color={theme.primary} /> : null}
      </View>
      <Text style={styles.heroTitle}>{activity.title}</Text>
      <Text style={styles.heroWhen}>{formatShortWhen(activity)}</Text>
      <Text style={styles.line} lightColor="#536471" darkColor="#71767b">
        {formatPlace(activity)}
      </Text>
      <CreatorPress userId={activity.creatorId}>
        <Text style={styles.line} lightColor="#536471" darkColor="#71767b">
          {activity.creatorName} · {formatHeadcount(activity)}
        </Text>
      </CreatorPress>
    </ActivityPressable>
  )
}

export function AgendaRow({
  activity,
  pending = false,
  showDate = true,
}: {
  activity: Activity
  pending?: boolean
  showDate?: boolean
}) {
  const theme = useTheme()
  const { messages } = useI18n()
  const parts = formatDateParts(activity)
  const accent = ACTIVITY_META[activity.type].color
  const dated = showDate && parts
  const timed = !showDate && parts

  return (
    <ActivityPressable activity={activity} style={[styles.row, { borderBottomColor: theme.border }]}>
      {dated ? (
        <View style={styles.date} lightColor="transparent" darkColor="transparent">
          <Text style={styles.weekday} lightColor="#536471" darkColor="#71767b">
            {parts.weekday}
          </Text>
          <Text style={[styles.day, { color: accent }]}>{parts.day}</Text>
          <Text style={styles.month} lightColor="#536471" darkColor="#71767b">
            {parts.month}
          </Text>
        </View>
      ) : timed ? (
        <View style={styles.timeCol} lightColor="transparent" darkColor="transparent">
          <Text style={styles.clock}>{formatClock(activity)}</Text>
        </View>
      ) : null}

      <View style={styles.body} lightColor="transparent" darkColor="transparent">
        <Text style={styles.title} numberOfLines={2}>
          {activity.title}
        </Text>
        <Text style={styles.line} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
          {dated
            ? `${formatClock(activity)} · ${formatPlace(activity)}`
            : parts
              ? formatPlace(activity)
              : `${messages.schedule.flexible} · ${formatPlace(activity)}`}
        </Text>
        <View style={styles.foot} lightColor="transparent" darkColor="transparent">
          <CreatorPress userId={activity.creatorId}>
            <Text style={[styles.line, styles.footText]} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
              {activity.creatorName} · {formatHeadcount(activity)}
            </Text>
          </CreatorPress>
          {pending ? <StatusPill label={messages.join.requested} color={theme.primary} /> : null}
        </View>
      </View>

      <View style={[styles.thumb, { borderColor: theme.border, backgroundColor: theme.background }]}>
        <AgendaThumb activity={activity} />
      </View>
    </ActivityPressable>
  )
}

function AgendaThumb({ activity }: { activity: Pick<Activity, "type" | "images"> }) {
  const sources = activityBannerSources(activity)
  const [index, setIndex] = useState(0)
  useEffect(() => {
    setIndex(0)
  }, [activity.images[0], activity.type])
  const source = sources[Math.min(index, sources.length - 1)]
  return (
    <Image
      source={source}
      resizeMode="cover"
      style={styles.thumbImage}
      onError={() => setIndex((current) => Math.min(current + 1, sources.length - 1))}
    />
  )
}

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: `${color}1a` }]} lightColor="transparent" darkColor="transparent">
      <Text style={[styles.pillLabel, { color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: listHairline,
    gap: 8,
  },
  heroMeta: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  heroWhen: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: listHairline,
  },
  date: {
    width: 44,
    alignItems: "center",
  },
  weekday: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  day: {
    marginTop: 1,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 26,
  },
  month: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  timeCol: {
    width: 52,
    paddingTop: 2,
  },
  clock: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  line: {
    fontSize: 13,
    lineHeight: 16,
  },
  foot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footText: {
    flexShrink: 1,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
})
