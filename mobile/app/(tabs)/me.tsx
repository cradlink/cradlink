import { useMemo } from "react"
import { Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { AgendaSection } from "@/components/AgendaCard"
import { EmptyState } from "@/components/EmptyState"
import { HostCard } from "@/components/HostCard"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { WaitingInbox } from "@/components/RequestList"
import { TopBar } from "@/components/TopBar"
import { Text, View, useTheme } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useMemberships } from "@/hooks/use-memberships"
import { groupBySchedule } from "@/lib/schedule"

export default function MyActivitiesScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { user } = useAuth()
  const { activities, ready } = useActivities()
  const { groups, flat } = useMemo(() => {
    const hosted = activities.filter((activity) => activity.creatorId === user?.id)
    const next = groupBySchedule(hosted)
    return {
      groups: next,
      flat: next.flatMap((group) => group.items),
    }
  }, [activities, user?.id])

  const sectioned = groups.length > 1

  return (
    <View style={styles.screen}>
      <TopBar title="My activities" />
      <Refreshable contentContainerStyle={styles.list}>
        {!ready ? null : (
          <Stagger>
            <WaitingInbox key="inbox" />
            {flat.length === 0 ? (
              <EmptyState
                key="empty"
                title="You haven’t posted yet."
                body="Host something people can actually show up to."
                icon={{ ios: "square.and.pencil", android: "edit", web: "edit" }}
                action={{
                  label: "Post an activity",
                  variant: "primary",
                  onPress: () => router.push("/activities/new"),
                }}
              />
            ) : sectioned ? (
              groups.flatMap((group) => [
                <AgendaSection key={`s-${group.key}`} title={group.title} />,
                ...group.items.map((activity) => <HostCard key={activity.id} activity={activity} />),
              ])
            ) : (
              flat.map((activity) => <HostCard key={activity.id} activity={activity} />)
            )}
          </Stagger>
        )}
      </Refreshable>
      <Pressable
        onPress={() => router.push("/activities/new")}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[styles.fabLabel, { color: theme.primaryForeground }]}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    paddingBottom: 96,
    flexGrow: 1,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  fabLabel: {
    fontSize: 32,
    fontWeight: "400",
    marginTop: -2,
  },
})
