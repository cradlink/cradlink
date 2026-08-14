import { useState } from "react"
import { Pressable, ScrollView, StyleSheet } from "react-native"

import { ActivityCard } from "@/components/ActivityCard"
import { EmptyState } from "@/components/EmptyState"
import { Text, View, useTheme } from "@/components/Themed"
import { MOCK_ACTIVITIES } from "@/lib/mock"

export default function MyActivitiesScreen() {
  const theme = useTheme()
  const [tab, setTab] = useState<"created" | "joined">("created")
  const created = MOCK_ACTIVITIES.filter((activity) => activity.creatorId === "user_marko")
  const joined = MOCK_ACTIVITIES.filter((activity) => activity.creatorId !== "user_marko")
  const list = tab === "created" ? created : joined

  return (
    <View style={styles.screen}>
      <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
        {(["created", "joined"] as const).map((value) => {
          const active = tab === value
          return (
            <Pressable key={value} onPress={() => setTab(value)} style={styles.tab}>
              <Text style={[styles.tabLabel, { fontWeight: active ? "700" : "400" }]}>
                {value === "created" ? "Created" : "Joined"}
              </Text>
              <View
                style={[
                  styles.indicator,
                  { backgroundColor: active ? theme.primary : "transparent" },
                ]}
              />
            </Pressable>
          )
        })}
      </View>
      <ScrollView>
        {list.length === 0 ? (
          <EmptyState
            title={tab === "created" ? "You haven’t posted yet." : "You haven’t joined anything yet."}
            body={tab === "created" ? "Create one from the + button." : "The feed is full of open seats."}
          />
        ) : (
          list.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
        )}
      </ScrollView>
    </View>
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
  },
  indicator: {
    marginTop: 10,
    height: 3,
    width: 56,
    borderRadius: 999,
  },
})
