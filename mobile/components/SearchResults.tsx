import { useMemo } from "react"
import { Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { ActivityCard } from "@/components/ActivityCard"
import { Avatar } from "@/components/Avatar"
import { EmptyState } from "@/components/EmptyState"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { Text, View, useTheme } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { searchActivities, searchPeople } from "@/lib/search"
import type { User } from "@/lib/types"

export function SearchResults({ query }: { query: string }) {
  const { user, people } = useAuth()
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
              <PersonRow key={person.id} person={person} isSelf={person.id === user?.id} />
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

function PersonRow({ person, isSelf }: { person: User; isSelf?: boolean }) {
  const router = useRouter()
  const theme = useTheme()
  const { messages } = useI18n()

  return (
    <Pressable
      onPress={() => (isSelf ? router.push("/profile") : router.push(`/u/${person.id}`))}
      style={({ pressed }) => [
        styles.person,
        { borderBottomColor: theme.border, backgroundColor: pressed ? theme.hover : "transparent" },
      ]}
    >
      <Avatar name={person.displayName} src={person.avatarUrl} size={40} />
      <View style={styles.personText} lightColor="transparent" darkColor="transparent">
        <Text style={styles.personName} numberOfLines={1}>
          {person.displayName}
        </Text>
        <Text style={styles.personMeta} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
          {person.username
            ? `@${person.username}`
            : person.location || (isSelf ? messages.common.you : messages.common.somewhere)}
        </Text>
      </View>
    </Pressable>
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
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  personText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  personName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  personMeta: {
    fontSize: 13,
  },
})
