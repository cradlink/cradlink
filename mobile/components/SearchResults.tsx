import { useMemo } from "react"
import { StyleSheet } from "react-native"

import { ActivityCard } from "@/components/ActivityCard"
import { EmptyState } from "@/components/EmptyState"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { Text } from "@/components/Themed"
import { UserRow } from "@/components/UserRow"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { searchActivities, searchPeople } from "@/lib/search"

export function SearchResults({ query }: { query: string }) {
  const { people } = useAuth()
  const { activities } = useActivities()
  const { messages } = useI18n()
  const q = query.trim()
  const foundPeople = useMemo(() => (q ? searchPeople(people, q) : []), [people, q])
  const foundActivities = useMemo(() => (q ? searchActivities(activities, q) : []), [activities, q])
  const empty = q.length > 0 && foundPeople.length === 0 && foundActivities.length === 0

  return (
    <Refreshable contentContainerStyle={styles.list} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
      <Stagger>
        {!q ? (
          <EmptyState
            key="hint"
            title={messages.search.hintTitle}
            body={messages.search.hintBody}
            icon={{ ios: "magnifyingglass", android: "search", web: "search" }}
            iconSize={28}
            iconColor="#e7e9ea"
          />
        ) : empty ? (
          <EmptyState key="empty" title={messages.search.emptyTitle} body={messages.search.emptyBody} />
        ) : (
          [
            foundPeople.length > 0 ? (
              <Text key="people-h" style={styles.section}>
                {messages.common.people}
              </Text>
            ) : null,
            ...foundPeople.map((person) => (
              <UserRow key={person.id} person={person} />
            )),
            foundActivities.length > 0 ? (
              <Text key="acts-h" style={styles.section}>
                {messages.common.activities}
              </Text>
            ) : null,
            ...foundActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} />),
          ]
        )}
      </Stagger>
    </Refreshable>
  )
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
})
