import { useMemo } from "react"
import { StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { AgendaHero, AgendaRow, AgendaSection } from "@/components/AgendaCard"
import { EmptyState } from "@/components/EmptyState"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { TopBar } from "@/components/TopBar"
import { ScreenBlurTarget } from "@/components/ScreenBlurTarget"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { useMemberships } from "@/hooks/use-memberships"
import { groupBySchedule, nextUp } from "@/lib/schedule"

export default function UpcomingScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { activities, ready } = useActivities()
  const { decorate, joinedIds, statusOf, ready: memReady } = useMemberships()
  const { locale, messages } = useI18n()

  const { next, groups, requested } = useMemo(() => {
    const joined = activities
      .filter((activity) => activity.creatorId !== user?.id && joinedIds.includes(activity.id))
      .map(decorate)

    const going = joined.filter((activity) => statusOf(activity.id) === "joined")
    const pending = joined.filter((activity) => statusOf(activity.id) === "pending")
    const featured = nextUp(going)
    const rest = featured ? going.filter((activity) => activity.id !== featured.id) : going

    return {
      next: featured,
      groups: groupBySchedule(rest),
      requested: pending,
    }
  }, [activities, decorate, joinedIds, locale, statusOf, user?.id])

  const empty = !next && groups.length === 0 && requested.length === 0

  return (
    <ScreenBlurTarget style={styles.screen}>
      <TopBar title={messages.upcoming.title} />
      <Refreshable contentContainerStyle={styles.list}>
        {!ready || !memReady ? null : (
          <Stagger>
            {empty ? (
              <EmptyState
                key="empty"
                title={messages.upcoming.emptyTitle}
                body={messages.upcoming.emptyBody}
                icon={{ ios: "calendar", android: "calendar_today", web: "calendar_today" }}
                action={{ label: messages.upcoming.findSomething, onPress: () => router.navigate("/") }}
              />
            ) : (
              [
                next ? <AgendaHero key={next.id} activity={next} /> : null,
                ...groups.flatMap((group) => [
                  <AgendaSection key={`s-${group.key}`} title={group.title} />,
                  ...group.items.map((activity) => (
                    <AgendaRow
                      key={activity.id}
                      activity={activity}
                      showDate={group.key !== "today" && group.key !== "tomorrow"}
                    />
                  )),
                ]),
                requested.length > 0 ? <AgendaSection key="requested" title={messages.upcoming.requested} /> : null,
                ...requested.map((activity) => (
                  <AgendaRow key={`p-${activity.id}`} activity={activity} pending />
                )),
              ]
            )}
          </Stagger>
        )}
      </Refreshable>
    </ScreenBlurTarget>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    paddingBottom: 40,
    flexGrow: 1,
  },
})
