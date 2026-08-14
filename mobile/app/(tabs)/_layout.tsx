import { Tabs } from "expo-router"

import { TabBar } from "@/components/TabBar"

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="me" options={{ title: "Mine" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", href: "/profile" }} />
    </Tabs>
  )
}
