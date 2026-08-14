import { StyleSheet } from "react-native"

import { EmptyState } from "@/components/EmptyState"
import { FollowRow } from "@/components/FollowInbox"
import { Refreshable, Stagger } from "@/components/Refreshable"
import { ScreenBlurTarget } from "@/components/ScreenBlurTarget"
import { TopBar } from "@/components/TopBar"
import { Text, View } from "@/components/Themed"
import { useConnections } from "@/hooks/use-connections"
import { useI18n } from "@/hooks/use-i18n"

export default function FollowRequestsScreen() {
  const { inbox } = useConnections()
  const { messages, tx } = useI18n()
  const items = inbox()

  return (
    <ScreenBlurTarget style={styles.screen}>
      <TopBar title={messages.profile.requestsTitle} back hideBell />
      <Refreshable contentContainerStyle={styles.list}>
        <Stagger>
          {items.length === 0 ? (
            <EmptyState
              key="empty"
              title={messages.profile.requestsTitle}
              body={messages.notifications.emptyBody}
            />
          ) : (
            [
              <Text key="count" style={styles.count} lightColor="#536471" darkColor="#71767b">
                {items.length === 1
                  ? messages.requests.oneWaiting
                  : tx(messages.requests.manyWaiting, { count: items.length })}
              </Text>,
              ...items.map((row) => (
                <View key={row.id} style={styles.item} lightColor="transparent" darkColor="transparent">
                  <FollowRow row={row} />
                </View>
              )),
            ]
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
  list: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  count: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  item: {
    paddingVertical: 10,
  },
})
