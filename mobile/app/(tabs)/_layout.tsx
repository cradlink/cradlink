import { Tabs } from "expo-router"

import { TabBar } from "@/components/TabBar"
import { useI18n } from "@/hooks/use-i18n"

export default function TabLayout() {
  const { messages } = useI18n()
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "transparent" } }}
    >
      <Tabs.Screen name="index" options={{ title: messages.tabs.home }} />
      <Tabs.Screen name="upcoming" options={{ title: messages.tabs.upcoming }} />
      <Tabs.Screen name="me" options={{ title: messages.tabs.me }} />
      <Tabs.Screen name="profile" options={{ title: messages.tabs.profile, href: "/profile" }} />
    </Tabs>
  )
}
