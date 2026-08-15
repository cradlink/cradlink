import { useMemo } from "react"
import { Pressable, StyleSheet } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"

import { EmptyState } from "@/components/EmptyState"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { ScreenBlurTarget } from "@/components/ScreenBlurTarget"
import { TopBar } from "@/components/TopBar"
import { Text, View, useTheme } from "@/components/Themed"
import { UserRow } from "@/components/UserRow"
import { useAuth } from "@/hooks/use-auth"
import { useConnections } from "@/hooks/use-connections"
import { useI18n } from "@/hooks/use-i18n"
import { handleOf } from "@/lib/types"

type Tab = "followers" | "following"

function asTab(value: string | string[] | undefined): Tab {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === "following" ? "following" : "followers"
}

function asId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default function ConnectionsScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { userId: rawId, tab: rawTab } = useLocalSearchParams<{ userId?: string; tab?: string }>()
  const { user, getUser } = useAuth()
  const { messages, tx } = useI18n()
  const { followersOf, followingPeopleOf, followsYou } = useConnections()
  const userId = asId(rawId) || user?.id
  const tab = asTab(rawTab)
  const person = userId ? getUser(userId) : null
  const isSelf = Boolean(user && userId === user.id)
  const people = tab === "followers" ? (userId ? followersOf(userId) : []) : userId ? followingPeopleOf(userId) : []

  const title = person ? handleOf(person) : messages.profile.title

  function openTab(next: Tab) {
    if (!userId) return
    router.replace(`/connections?userId=${userId}&tab=${next}`)
  }

  const emptyTitle =
    tab === "followers" ? messages.connections.emptyFollowersTitle : messages.connections.emptyFollowingTitle
  const emptyBody =
    tab === "followers"
      ? isSelf
        ? messages.connections.emptyFollowersBodySelf
        : tx(messages.connections.emptyFollowersBodyOther, { name: person?.displayName ?? "" })
      : isSelf
        ? messages.connections.emptyFollowingBodySelf
        : tx(messages.connections.emptyFollowingBodyOther, { name: person?.displayName ?? "" })

  const tabs = useMemo(
    () =>
      [
        { key: "followers" as const, label: messages.connections.followers },
        { key: "following" as const, label: messages.connections.following },
      ] as const,
    [messages.connections.followers, messages.connections.following],
  )

  return (
    <ScreenBlurTarget style={styles.screen}>
      <TopBar title={title} back hideBell />
      <View style={[styles.tabs, { borderBottomColor: theme.border }]} lightColor="transparent" darkColor="transparent">
        {tabs.map((item) => {
          const active = item.key === tab
          return (
            <Pressable key={item.key} onPress={() => openTab(item.key)} style={styles.tab}>
              <Text style={[styles.tabLabel, active && styles.tabActive]}>{item.label}</Text>
              {active ? <View style={[styles.tabLine, { backgroundColor: theme.primary }]} /> : null}
            </Pressable>
          )
        })}
      </View>
      <Refreshable contentContainerStyle={styles.list}>
        <Stagger>
          {people.length === 0 ? (
            <EmptyState key="empty" title={emptyTitle} body={emptyBody} />
          ) : (
            people.map((entry) => (
              <UserRow key={entry.id} person={entry} followsYou={followsYou(entry.id)} />
            ))
          )}
        </Stagger>
      </Refreshable>
    </ScreenBlurTarget>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: 12,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: "600",
    paddingBottom: 10,
    color: "#71767b",
  },
  tabActive: {
    color: "#e7e9ea",
    fontWeight: "800",
  },
  tabLine: {
    height: 3,
    alignSelf: "stretch",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  list: {
    flexGrow: 1,
    paddingBottom: 40,
  },
})
